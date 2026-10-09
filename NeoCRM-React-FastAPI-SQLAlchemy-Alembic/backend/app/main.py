from datetime import datetime, timezone
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.security import verify_password, hash_password, create_access_token, decode_token
from app.db.session import get_db
from app.db.seed import seed
from app.models import *
from app.schemas.api import LoginRequest, UserWrite, OrgWrite, CustomerWrite, LeadWrite, LeadStageWrite, ActivityWrite, EmailRequest
from app.core.deps import current_user, require_permission
from app.services.audit_service import write_audit

app=FastAPI(title='NeoCRM API',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in settings.cors_origins.split(',') if x.strip()],allow_credentials=False,allow_methods=['*'],allow_headers=['*'])

@app.on_event('startup')
def startup(): seed()

def err(code,message,status): raise HTTPException(status_code=status,detail=message)
def user_payload(u,db):
 role=u.roles[0].role.name if u.roles else 'sales'
 org=db.get(Organization,u.organization_id)
 perms=sorted({f'{rp.permission.resource}:{rp.permission.action}' for ur in u.roles for rp in ur.role.permissions})
 return {'id':u.id,'name':u.name,'email':u.email,'role':role,'organization':org.name if org else '', 'permissions':perms}

@app.get('/health')
def health(db:Session=Depends(get_db)):
 try: db.execute(text('SELECT 1')); return {'status':'ok','database':'connected','service':'api'}
 except Exception: raise HTTPException(503,detail='Database unavailable')

@app.post('/auth/login')
def login(payload:LoginRequest,request:Request,db:Session=Depends(get_db)):
 u=db.execute(select(User).options(joinedload(User.roles).joinedload(UserRole.role).joinedload(Role.permissions).joinedload(RolePermission.permission)).where(func.lower(User.email)==payload.email.lower())).unique().scalar_one_or_none()
 if not u or u.status!='ACTIVE' or not verify_password(u.password_hash,payload.password):
  if u: write_audit(db,u,'LOGIN','Auth','DENIED',request=request)
  err('INVALID_CREDENTIALS','Invalid email or password',401)
 token,jti,exp=create_access_token(u.id); db.add(Session(user_id=u.id,jti=jti,expires_at=exp)); db.commit(); write_audit(db,u,'LOGIN','Auth','SUCCESS',request=request)
 p=user_payload(u,db); return {'access_token':token,'user':{k:p[k] for k in ['id','name','email','role','organization']}}

@app.get('/auth/me')
def me(u:User=Depends(current_user),db:Session=Depends(get_db)): return {k:user_payload(u,db)[k] for k in ['id','name','email','role','organization']}

@app.post('/auth/logout')
def logout(request:Request,u:User=Depends(current_user),db:Session=Depends(get_db),authorization:str|None=None):
 # Revoke the current session identified by the JWT.
 auth=request.headers.get('authorization',''); payload=decode_token(auth[7:]); s=db.query(Session).filter(Session.jti==payload.get('jti')).first()
 if s: s.revoked_at=datetime.now(timezone.utc); db.commit()
 write_audit(db,u,'LOGOUT','Auth','SUCCESS',request=request); return {'success':True}

@app.get('/users')
def users(u:User=Depends(require_permission('users','read')),db:Session=Depends(get_db)):
 rows=db.execute(select(User).options(joinedload(User.roles).joinedload(UserRole.role)).where(User.organization_id==u.organization_id).order_by(User.created_at)).unique().scalars()
 return [{'id':x.id,'name':x.name,'email':x.email,'role':x.roles[0].role.name if x.roles else 'sales','status':'Active' if x.status=='ACTIVE' else 'Inactive'} for x in rows]

VALID_ROLES={'admin','sales_manager','sales','inventory','auditor'}
@app.post('/users',status_code=201)
def create_user(payload:UserWrite,request:Request,u:User=Depends(require_permission('users','write')),db:Session=Depends(get_db)):
 if payload.role not in VALID_ROLES or payload.status not in {'Active','Inactive'}: err('VALIDATION_ERROR','Invalid user data',422)
 if db.query(User).filter(func.lower(User.email)==payload.email.lower()).first(): err('EMAIL_ALREADY_EXISTS','A user with this email already exists.',409)
 role=db.query(Role).filter(Role.name==payload.role).first();
 if not role: err('ROLE_NOT_FOUND','Role not configured',422)
 nu=User(name=payload.name,email=payload.email.lower(),password_hash=hash_password('Welcome@123'),organization_id=u.organization_id,status='ACTIVE' if payload.status=='Active' else 'INACTIVE'); db.add(nu); db.flush(); db.add(UserRole(user_id=nu.id,role_id=role.id)); db.commit(); write_audit(db,u,'CREATE','User','SUCCESS',nu.id,after={'name':nu.name,'email':nu.email,'role':payload.role,'status':payload.status},request=request); return {'id':nu.id,'name':nu.name,'email':nu.email,'role':payload.role,'status':payload.status}

@app.put('/users/{user_id}')
def update_user(user_id:str,payload:UserWrite,request:Request,u:User=Depends(require_permission('users','write')),db:Session=Depends(get_db)):
 if payload.role not in VALID_ROLES or payload.status not in {'Active','Inactive'}: err('VALIDATION_ERROR','Invalid user data',422)
 ex=db.query(User).options(joinedload(User.roles).joinedload(UserRole.role)).filter(User.id==user_id,User.organization_id==u.organization_id).first()
 if not ex: err('USER_NOT_FOUND','User was not found.',404)
 role=db.query(Role).filter(Role.name==payload.role).first();
 if not role: err('ROLE_NOT_FOUND','Role not configured',422)
 before={'name':ex.name,'email':ex.email,'role':ex.roles[0].role.name if ex.roles else None,'status':ex.status}; ex.name=payload.name; ex.email=payload.email.lower(); ex.status='ACTIVE' if payload.status=='Active' else 'INACTIVE'; ex.roles.clear(); db.flush(); db.add(UserRole(user_id=ex.id,role_id=role.id)); db.commit(); write_audit(db,u,'UPDATE','User','SUCCESS',ex.id,before=before,after={'name':ex.name,'email':ex.email,'role':payload.role,'status':payload.status},request=request); return {'id':ex.id,'name':ex.name,'email':ex.email,'role':payload.role,'status':payload.status}

@app.delete('/users/{user_id}')
def deactivate_user(user_id:str,request:Request,u:User=Depends(require_permission('users','write')),db:Session=Depends(get_db)):
 ex=db.query(User).filter(User.id==user_id,User.organization_id==u.organization_id).first()
 if not ex: err('USER_NOT_FOUND','User was not found.',404)
 before=ex.status; ex.status='INACTIVE'; db.commit(); write_audit(db,u,'DELETE','User','SUCCESS',ex.id,before={'status':before},after={'status':'INACTIVE'},request=request); return {'success':True}

@app.get('/organization')
def get_org(u:User=Depends(require_permission('organization','read')),db:Session=Depends(get_db)):
 o=db.get(Organization,u.organization_id); return {'name':o.name,'industry':o.industry,'location':o.location,'currency':o.currency} if o else {}
@app.put('/organization')
def update_org(payload:OrgWrite,request:Request,u:User=Depends(require_permission('organization','write')),db:Session=Depends(get_db)):
 o=db.get(Organization,u.organization_id); before={'name':o.name,'industry':o.industry,'location':o.location,'currency':o.currency}; o.name=payload.name;o.industry=payload.industry;o.location=payload.location;o.currency=payload.currency;db.commit(); after={'name':o.name,'industry':o.industry,'location':o.location,'currency':o.currency};write_audit(db,u,'UPDATE','Organization','SUCCESS',o.id,before=before,after=after,request=request);return after

@app.get('/audit')
def audit(page:int=1,limit:int=10,action:str='',result:str='',u:User=Depends(require_permission('audit','read')),db:Session=Depends(get_db)):
 q=select(AuditLog).options(joinedload(AuditLog.actor)).where(AuditLog.organization_id==u.organization_id).order_by(AuditLog.created_at.desc()).offset(max(0,page-1)*min(limit,100)).limit(min(max(limit,1),100))
 if action:q=q.where(AuditLog.action==action)
 if result:q=q.where(AuditLog.result==result)
 rows=db.execute(q).unique().scalars();return [{'id':x.id,'actor':x.actor.name if x.actor else 'Unknown','action':x.action,'resource':x.resource,'result':x.result,'time':x.created_at.isoformat() if x.created_at else ''} for x in rows]

CUSTOMER_TYPES={'Customer','Distributor','OEM','Partner','Supplier'}
LEAD_STAGES={'NEW','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'}

def customer_payload(x):
 return {'id':x.id,'name':x.name,'company':x.company,'type':x.type,'industry':x.industry,'location':x.location,'parent_customer_id':x.parent_customer_id,'last':x.last_contact_at.isoformat() if x.last_contact_at else 'Never','status':x.status,'created_at':x.created_at.isoformat() if x.created_at else None}

def lead_payload(x):
 return {'id':x.id,'company':x.company,'contactName':x.contact_name,'contact_name':x.contact_name,'email':x.email,'phone':x.phone,'source':x.source,'description':x.description,'customer_id':x.customer_id,'owner_user_id':x.owner_user_id,'status':x.status,'value':float(x.value),'created_at':x.created_at.isoformat() if x.created_at else None,'updated_at':x.updated_at.isoformat() if x.updated_at else None}

@app.get('/customers')
def customers(search:str='',type:str='',status:str='',sort:str='created_at',direction:str='desc',u:User=Depends(require_permission('customers','read')),db:Session=Depends(get_db)):
 if type and type not in CUSTOMER_TYPES: err('VALIDATION_ERROR','Invalid customer type',422)
 if status and status not in {'Active','Inactive'}: err('VALIDATION_ERROR','Invalid customer status',422)
 q=select(Customer).where(Customer.organization_id==u.organization_id)
 if search: term=f'%{search.strip()}%';q=q.where(or_(Customer.name.ilike(term),Customer.company.ilike(term),Customer.industry.ilike(term),Customer.location.ilike(term)))
 if type:q=q.where(Customer.type==type)
 if status:q=q.where(Customer.status==status)
 cols={'name':Customer.name,'company':Customer.company,'type':Customer.type,'industry':Customer.industry,'location':Customer.location,'created_at':Customer.created_at}
 if sort not in cols or direction not in {'asc','desc'}:err('VALIDATION_ERROR','Invalid sort parameters',422)
 order=cols[sort].asc() if direction=='asc' else cols[sort].desc()
 return [customer_payload(x) for x in db.execute(q.order_by(order,Customer.id)).scalars()]

@app.post('/customers',status_code=201)
def create_customer(payload:CustomerWrite,request:Request,u:User=Depends(require_permission('customers','write')),db:Session=Depends(get_db)):
 data=payload.model_dump();data['name']=data['name'].strip();data['company']=data['company'].strip()
 if not data['name'] or not data['company'] or data['type'] not in CUSTOMER_TYPES:err('VALIDATION_ERROR','Invalid customer data',422)
 if data['parent_customer_id'] and not db.query(Customer).filter(Customer.id==data['parent_customer_id'],Customer.organization_id==u.organization_id).first():err('CUSTOMER_NOT_FOUND','Parent customer was not found.',404)
 c=Customer(organization_id=u.organization_id,**data);db.add(c);db.commit();write_audit(db,u,'CREATE','Customer','SUCCESS',c.id,after=data,request=request);return customer_payload(c)

@app.put('/customers/{customer_id}')
def update_customer(customer_id:str,payload:CustomerWrite,request:Request,u:User=Depends(require_permission('customers','write')),db:Session=Depends(get_db)):
 c=db.query(Customer).filter(Customer.id==customer_id,Customer.organization_id==u.organization_id).first()
 if not c:err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 data=payload.model_dump();data['name']=data['name'].strip();data['company']=data['company'].strip()
 if not data['name'] or not data['company'] or data['type'] not in CUSTOMER_TYPES:err('VALIDATION_ERROR','Invalid customer data',422)
 if data['parent_customer_id']:
  parent=db.query(Customer).filter(Customer.id==data['parent_customer_id'],Customer.organization_id==u.organization_id).first()
  if not parent:err('CUSTOMER_NOT_FOUND','Parent customer was not found.',404)
  seen=set()
  while parent:
   if parent.id==c.id:err('VALIDATION_ERROR','Customer relationship would create a cycle',422)
   if parent.id in seen:err('VALIDATION_ERROR','Existing customer relationship contains a cycle',422)
   seen.add(parent.id)
   parent=db.query(Customer).filter(Customer.id==parent.parent_customer_id,Customer.organization_id==u.organization_id).first() if parent.parent_customer_id else None
 before=customer_payload(c)
 for key,value in data.items():setattr(c,key,value)
 db.commit();write_audit(db,u,'UPDATE','Customer','SUCCESS',c.id,before=before,after=data,request=request);return customer_payload(c)

@app.delete('/customers/{customer_id}')
def deactivate_customer(customer_id:str,request:Request,u:User=Depends(require_permission('customers','write')),db:Session=Depends(get_db)):
 c=db.query(Customer).filter(Customer.id==customer_id,Customer.organization_id==u.organization_id).first()
 if not c:err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 before=c.status;c.status='Inactive';db.commit();write_audit(db,u,'DELETE','Customer','SUCCESS',c.id,before={'status':before},after={'status':'Inactive'},request=request);return {'success':True}

@app.get('/customers/{customer_id}')
def customer_detail(customer_id:str,u:User=Depends(require_permission('customers','read')),db:Session=Depends(get_db)):
 c=db.query(Customer).filter(Customer.id==customer_id,Customer.organization_id==u.organization_id).first()
 if not c:err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 result=customer_payload(c);result['parent']=customer_payload(c.parent) if c.parent else None
 result['relationships']=[customer_payload(x) for x in db.query(Customer).filter(Customer.parent_customer_id==c.id,Customer.organization_id==u.organization_id).order_by(Customer.name).all()]
 result['leads']=[lead_payload(x) for x in db.query(Lead).filter(Lead.customer_id==c.id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).order_by(Lead.created_at.desc()).all()]
 return result

@app.get('/customers/{customer_id}/history')
def customer_history(customer_id:str,u:User=Depends(require_permission('customers','read')),db:Session=Depends(get_db)):
 c=db.query(Customer).filter(Customer.id==customer_id,Customer.organization_id==u.organization_id).first()
 if not c:err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 rows=db.query(CustomerActivity).filter(CustomerActivity.customer_id==c.id,CustomerActivity.organization_id==u.organization_id).order_by(CustomerActivity.created_at.desc()).all()
 return [{'id':a.id,'kind':a.kind,'title':a.title,'notes':a.notes,'actor':a.actor.name if a.actor else None,'created_at':a.created_at.isoformat()} for a in rows]

@app.post('/customers/{customer_id}/history',status_code=201)
def add_customer_history(customer_id:str,payload:ActivityWrite,request:Request,u:User=Depends(require_permission('customers','write')),db:Session=Depends(get_db)):
 c=db.query(Customer).filter(Customer.id==customer_id,Customer.organization_id==u.organization_id).first()
 if not c:err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 a=CustomerActivity(organization_id=u.organization_id,customer_id=c.id,actor_user_id=u.id,kind=payload.kind,title=payload.title.strip(),notes=payload.notes);db.add(a)
 if payload.kind in {'CALL','EMAIL','MEETING'}:c.last_contact_at=datetime.now(timezone.utc)
 db.commit();write_audit(db,u,'CREATE','CustomerActivity','SUCCESS',a.id,after={'customer_id':c.id,'kind':a.kind,'title':a.title},request=request)
 return {'id':a.id,'kind':a.kind,'title':a.title,'notes':a.notes,'created_at':a.created_at.isoformat()}

@app.get('/dashboard/summary')
def dashboard(u:User=Depends(current_user),db:Session=Depends(get_db)):
 total=db.query(Customer).filter(Customer.organization_id==u.organization_id).count(); active=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None),Lead.status.notin_(['WON','LOST'])).count(); pipeline=db.query(func.coalesce(func.sum(Lead.value),0)).filter(Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None),Lead.status.notin_(['WON','LOST'])).scalar() or 0; quotes=db.query(Quote).filter(Quote.organization_id==u.organization_id,Quote.status!='DRAFT').count(); total_closed=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None),Lead.status.in_(['WON','LOST'])).count(); won=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None),Lead.status=='WON').count(); conversion=round((won/total_closed)*100,1) if total_closed else 0
 return {'totalCustomers':total,'activeLeads':active,'pipelineValue':float(pipeline),'quotesSent':quotes,'conversionRate':conversion}

@app.get('/leads')
def leads(search:str='',status:str='',sort:str='created_at',direction:str='desc',u:User=Depends(require_permission('leads','read')),db:Session=Depends(get_db)):
 if status and status not in LEAD_STAGES:err('VALIDATION_ERROR','Invalid lead stage',422)
 q=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None))
 if search:
  term=f'%{search.strip()}%';q=q.filter(or_(Lead.company.ilike(term),Lead.contact_name.ilike(term),Lead.email.ilike(term)))
 if status:q=q.filter(Lead.status==status)
 cols={'created_at':Lead.created_at,'company':Lead.company,'value':Lead.value,'status':Lead.status}
 if sort not in cols or direction not in {'asc','desc'}:err('VALIDATION_ERROR','Invalid sort parameters',422)
 order=cols[sort].asc() if direction=='asc' else cols[sort].desc()
 return [lead_payload(x) for x in q.order_by(order,Lead.id).all()]

@app.post('/leads',status_code=201)
def create_lead(payload:LeadWrite,request:Request,u:User=Depends(require_permission('leads','write')),db:Session=Depends(get_db)):
 data=payload.model_dump();data['company']=data['company'].strip();data['contact_name']=data['contact_name'].strip()
 if not data['company'] or not data['contact_name']:err('VALIDATION_ERROR','Lead company and contact are required',422)
 if data['customer_id'] and not db.query(Customer).filter(Customer.id==data['customer_id'],Customer.organization_id==u.organization_id).first():err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 if data['owner_user_id'] and not db.query(User).filter(User.id==data['owner_user_id'],User.organization_id==u.organization_id,User.status=='ACTIVE').first():err('USER_NOT_FOUND','Lead owner was not found.',404)
 lead=Lead(organization_id=u.organization_id,**data);db.add(lead);db.flush();db.add(LeadActivity(organization_id=u.organization_id,lead_id=lead.id,actor_user_id=u.id,kind='STAGE',title='Lead created in NEW stage'));db.commit();write_audit(db,u,'CREATE','Lead','SUCCESS',lead.id,after=data,request=request);return lead_payload(lead)

@app.get('/leads/{lead_id}')
def lead_detail(lead_id:str,u:User=Depends(require_permission('leads','read')),db:Session=Depends(get_db)):
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 return lead_payload(lead)

@app.put('/leads/{lead_id}')
def update_lead(lead_id:str,payload:LeadWrite,request:Request,u:User=Depends(require_permission('leads','write')),db:Session=Depends(get_db)):
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 data=payload.model_dump();data['company']=data['company'].strip();data['contact_name']=data['contact_name'].strip()
 if data['customer_id'] and not db.query(Customer).filter(Customer.id==data['customer_id'],Customer.organization_id==u.organization_id).first():err('CUSTOMER_NOT_FOUND','Customer was not found.',404)
 if data['owner_user_id'] and not db.query(User).filter(User.id==data['owner_user_id'],User.organization_id==u.organization_id,User.status=='ACTIVE').first():err('USER_NOT_FOUND','Lead owner was not found.',404)
 before=lead_payload(lead)
 for key,value in data.items():setattr(lead,key,value)
 db.commit();write_audit(db,u,'UPDATE','Lead','SUCCESS',lead.id,before=before,after=data,request=request);return lead_payload(lead)

@app.delete('/leads/{lead_id}')
def delete_lead(lead_id:str,request:Request,u:User=Depends(require_permission('leads','write')),db:Session=Depends(get_db)):
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 before=lead_payload(lead);lead.deleted_at=datetime.now(timezone.utc);db.commit();write_audit(db,u,'DELETE','Lead','SUCCESS',lead.id,before=before,after={'deleted_at':lead.deleted_at.isoformat()},request=request);return {'success':True}

@app.patch('/leads/{lead_id}/stage')
def change_lead_stage(lead_id:str,payload:LeadStageWrite,request:Request,u:User=Depends(require_permission('leads','write')),db:Session=Depends(get_db)):
 stage=payload.status.upper()
 if stage not in LEAD_STAGES:err('VALIDATION_ERROR','Invalid lead stage',422)
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 if lead.status==stage:return lead_payload(lead)
 before=lead.status;lead.status=stage;db.add(LeadActivity(organization_id=u.organization_id,lead_id=lead.id,actor_user_id=u.id,kind='STAGE',title=f'Stage changed from {before} to {stage}'));db.commit();write_audit(db,u,'UPDATE','Lead','SUCCESS',lead.id,before={'status':before},after={'status':stage},request=request);return lead_payload(lead)

@app.get('/leads/{lead_id}/activities')
def lead_activities(lead_id:str,u:User=Depends(require_permission('leads','read')),db:Session=Depends(get_db)):
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 rows=db.query(LeadActivity).filter(LeadActivity.lead_id==lead.id,LeadActivity.organization_id==u.organization_id).order_by(LeadActivity.created_at.desc()).all()
 return [{'id':a.id,'kind':a.kind,'title':a.title,'notes':a.notes,'due_at':a.due_at.isoformat() if a.due_at else None,'completed_at':a.completed_at.isoformat() if a.completed_at else None,'actor':a.actor.name if a.actor else None,'created_at':a.created_at.isoformat()} for a in rows]

@app.get('/leads/{lead_id}/timeline')
def lead_timeline(lead_id:str,u:User=Depends(require_permission('leads','read')),db:Session=Depends(get_db)):
 return lead_activities(lead_id,u,db)

@app.post('/leads/{lead_id}/activities',status_code=201)
def add_lead_activity(lead_id:str,payload:ActivityWrite,request:Request,u:User=Depends(require_permission('leads','write')),db:Session=Depends(get_db)):
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 a=LeadActivity(organization_id=u.organization_id,lead_id=lead.id,actor_user_id=u.id,kind=payload.kind,title=payload.title.strip(),notes=payload.notes,due_at=payload.due_at);db.add(a);db.commit();write_audit(db,u,'CREATE','LeadActivity','SUCCESS',a.id,after={'lead_id':lead.id,'kind':a.kind,'title':a.title},request=request)
 return {'id':a.id,'kind':a.kind,'title':a.title,'notes':a.notes,'due_at':a.due_at.isoformat() if a.due_at else None,'completed_at':None,'created_at':a.created_at.isoformat()}

@app.patch('/leads/{lead_id}/activities/{activity_id}/complete')
def complete_lead_activity(lead_id:str,activity_id:str,request:Request,u:User=Depends(require_permission('leads','write')),db:Session=Depends(get_db)):
 lead=db.query(Lead).filter(Lead.id==lead_id,Lead.organization_id==u.organization_id,Lead.deleted_at.is_(None)).first()
 if not lead:err('LEAD_NOT_FOUND','Lead was not found.',404)
 a=db.query(LeadActivity).filter(LeadActivity.id==activity_id,LeadActivity.lead_id==lead.id,LeadActivity.organization_id==u.organization_id,LeadActivity.kind=='TASK').first()
 if not a:err('ACTIVITY_NOT_FOUND','Task was not found.',404)
 a.completed_at=a.completed_at or datetime.now(timezone.utc);db.commit();write_audit(db,u,'UPDATE','LeadActivity','SUCCESS',a.id,after={'completed_at':a.completed_at.isoformat()},request=request);return {'id':a.id,'completed_at':a.completed_at.isoformat()}

@app.post('/v1/email/classify')
def classify_email(payload:EmailRequest):
 text=f'{payload.subject} {payload.body}'.lower(); sales=sum(t in text for t in ['quote','quotation','price','pricing','buy','purchase','require','need','kg','ton']); support=sum(t in text for t in ['issue','problem','error','complaint','not working','support'])
 if sales>support and sales: cat,conf='SALES_INQUIRY',min(.95,.65+sales*.05)
 elif support: cat,conf='SUPPORT',min(.95,.65+support*.05)
 else: cat,conf='OTHER',.55
 return {'category':cat,'confidence':round(conf,2),'extracted':{'subject':payload.subject.strip()},'provider':'prototype-rule-engine'}
