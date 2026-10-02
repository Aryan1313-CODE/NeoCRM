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
from app.schemas.api import LoginRequest, UserWrite, OrgWrite, CustomerWrite, EmailRequest
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

@app.get('/customers')
def customers(search:str='',u:User=Depends(require_permission('customers','read')),db:Session=Depends(get_db)):
 q=select(Customer).where(Customer.organization_id==u.organization_id).order_by(Customer.created_at.desc())
 if search: term=f'%{search.strip()}%';q=q.where(or_(Customer.name.ilike(term),Customer.company.ilike(term),Customer.industry.ilike(term),Customer.location.ilike(term)))
 rows=db.execute(q).scalars();return [{'id':x.id,'name':x.name,'company':x.company,'type':x.type,'industry':x.industry,'location':x.location,'last':x.last_contact_at.isoformat() if x.last_contact_at else 'Never','status':x.status} for x in rows]
@app.post('/customers',status_code=201)
def create_customer(payload:CustomerWrite,request:Request,u:User=Depends(require_permission('customers','write')),db:Session=Depends(get_db)):
 c=Customer(organization_id=u.organization_id,**payload.model_dump());db.add(c);db.commit();write_audit(db,u,'CREATE','Customer','SUCCESS',c.id,after=payload.model_dump(),request=request);return {'id':c.id,**payload.model_dump(),'status':'Active','last':'Never'}

@app.get('/dashboard/summary')
def dashboard(u:User=Depends(current_user),db:Session=Depends(get_db)):
 total=db.query(Customer).filter(Customer.organization_id==u.organization_id).count(); active=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.status.notin_(['WON','LOST'])).count(); pipeline=db.query(func.coalesce(func.sum(Lead.value),0)).filter(Lead.organization_id==u.organization_id,Lead.status.notin_(['WON','LOST'])).scalar() or 0; quotes=db.query(Quote).filter(Quote.organization_id==u.organization_id,Quote.status!='DRAFT').count(); total_closed=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.status.in_(['WON','LOST'])).count(); won=db.query(Lead).filter(Lead.organization_id==u.organization_id,Lead.status=='WON').count(); conversion=round((won/total_closed)*100,1) if total_closed else 0
 return {'totalCustomers':total,'activeLeads':active,'pipelineValue':float(pipeline),'quotesSent':quotes,'conversionRate':conversion}

@app.get('/leads')
def leads(u:User=Depends(require_permission('leads','read')),db:Session=Depends(get_db)):
 rows=db.query(Lead).filter(Lead.organization_id==u.organization_id).order_by(Lead.created_at.desc()).all();return [{'id':x.id,'company':x.company,'contactName':x.contact_name,'status':x.status,'value':float(x.value)} for x in rows]

@app.post('/v1/email/classify')
def classify_email(payload:EmailRequest):
 text=f'{payload.subject} {payload.body}'.lower(); sales=sum(t in text for t in ['quote','quotation','price','pricing','buy','purchase','require','need','kg','ton']); support=sum(t in text for t in ['issue','problem','error','complaint','not working','support'])
 if sales>support and sales: cat,conf='SALES_INQUIRY',min(.95,.65+sales*.05)
 elif support: cat,conf='SUPPORT',min(.95,.65+support*.05)
 else: cat,conf='OTHER',.55
 return {'category':cat,'confidence':round(conf,2),'extracted':{'subject':payload.subject.strip()},'provider':'prototype-rule-engine'}
