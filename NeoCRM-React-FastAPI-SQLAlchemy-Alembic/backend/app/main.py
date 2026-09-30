from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.security import verify_password, create_access_token, decode_token
from app.db.session import get_db
from app.db.seed import seed
from app.models import Organization, User, Role, UserRole, RolePermission, Session as LoginSession, Customer, Lead, Quote, AuditLog
from app.schemas.api import LoginRequest, UserWrite, OrgWrite, CustomerWrite, EmailRequest
from app.core.deps import current_user, require_permission
from app.services.audit_service import write_audit
from app.services.user_service import list_users, create_user as service_create_user, update_user as service_update_user, deactivate_user as service_deactivate_user, UserServiceError
from app.services.crm_service import dashboard_summary
from app.services.crm_service import create_customer as service_create_customer
from app.services.organization_service import get_organization, update_organization
from app.ai.services.email_classification import classify_email as classify_email_service
from app.core.errors import http_error_handler, validation_error_handler, unexpected_error_handler

app=FastAPI(title='NeoCRM API',version='2.0.0')
app.add_exception_handler(StarletteHTTPException, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, unexpected_error_handler)
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in settings.cors_origins.split(',') if x.strip()],allow_credentials=False,allow_methods=['*'],allow_headers=['*'])

@app.on_event('startup')
def startup(): seed()

def err(code,message,status): raise HTTPException(status_code=status,detail={'code':code,'message':message})
def invoke_service(service,*args):
 try: return service(*args)
 except UserServiceError as exc: err(exc.code,exc.message,exc.status_code)
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
  write_audit(db,u,'LOGIN','Auth','DENIED',request=request,extra={
   'organization_id':u.organization_id if u else '00000000-0000-0000-0000-000000000001',
   'actor_email':payload.email.lower(),
  })
  err('INVALID_CREDENTIALS','Invalid email or password',401)
 token,jti,exp=create_access_token(u.id); db.add(LoginSession(user_id=u.id,jti=jti,expires_at=exp)); db.commit(); write_audit(db,u,'LOGIN','Auth','SUCCESS',request=request)
 p=user_payload(u,db); return {'access_token':token,'user':{k:p[k] for k in ['id','name','email','role','organization']}}

@app.get('/auth/me')
def me(u:User=Depends(current_user),db:Session=Depends(get_db)): return {k:user_payload(u,db)[k] for k in ['id','name','email','role','organization']}

@app.post('/auth/logout')
def logout(request:Request,u:User=Depends(current_user),db:Session=Depends(get_db)):
 # Revoke the current session identified by the JWT.
 auth=request.headers.get('authorization',''); payload=decode_token(auth[7:]); s=db.query(LoginSession).filter(LoginSession.jti==payload.get('jti')).first()
 if s: s.revoked_at=datetime.now(timezone.utc); db.commit()
 write_audit(db,u,'LOGOUT','Auth','SUCCESS',request=request); return {'success':True}

@app.get('/users')
def users(u:User=Depends(require_permission('users','read')),db:Session=Depends(get_db)):
 return list_users(db,u.organization_id)

@app.post('/users',status_code=201)
def create_user(payload:UserWrite,request:Request,u:User=Depends(require_permission('users','write')),db:Session=Depends(get_db)):
 return invoke_service(service_create_user,db,u,payload,request)

@app.put('/users/{user_id}')
def update_user(user_id:str,payload:UserWrite,request:Request,u:User=Depends(require_permission('users','write')),db:Session=Depends(get_db)):
 return invoke_service(service_update_user,db,u,user_id,payload,request)

@app.delete('/users/{user_id}')
def deactivate_user(user_id:str,request:Request,u:User=Depends(require_permission('users','write')),db:Session=Depends(get_db)):
 return invoke_service(service_deactivate_user,db,u,user_id,request)

@app.get('/organization')
def get_org(u:User=Depends(require_permission('organization','read')),db:Session=Depends(get_db)):
 return get_organization(db,u.organization_id) or {}
@app.put('/organization')
def update_org(payload:OrgWrite,request:Request,u:User=Depends(require_permission('organization','write')),db:Session=Depends(get_db)):
 after=update_organization(db,u,payload,request)
 if after is None: err('ORGANIZATION_NOT_FOUND','Organization was not found.',404)
 return after

@app.get('/audit')
def audit(page:int=Query(default=1,ge=1),limit:int=Query(default=10,ge=1,le=100),action:str=Query(default='',max_length=80),result:str=Query(default='',max_length=20),u:User=Depends(require_permission('audit','read')),db:Session=Depends(get_db)):
 q=select(AuditLog).options(joinedload(AuditLog.actor)).where(AuditLog.organization_id==u.organization_id).order_by(AuditLog.created_at.desc()).offset((page-1)*limit).limit(limit)
 if action:q=q.where(AuditLog.action==action)
 if result:q=q.where(AuditLog.result==result)
 rows=db.execute(q).unique().scalars();return [{'id':x.id,'actor':x.actor.name if x.actor else 'Unknown','action':x.action,'resource':x.resource,'result':x.result,'time':x.created_at.isoformat() if x.created_at else ''} for x in rows]

@app.get('/customers')
def customers(search:str=Query(default='',max_length=200),u:User=Depends(require_permission('customers','read')),db:Session=Depends(get_db)):
 q=select(Customer).where(Customer.organization_id==u.organization_id).order_by(Customer.created_at.desc())
 if search: term=f'%{search.strip()}%';q=q.where(or_(Customer.name.ilike(term),Customer.company.ilike(term),Customer.industry.ilike(term),Customer.location.ilike(term)))
 rows=db.execute(q).scalars();return [{'id':x.id,'name':x.name,'company':x.company,'type':x.type,'industry':x.industry,'location':x.location,'last':x.last_contact_at.isoformat() if x.last_contact_at else 'Never','status':x.status} for x in rows]
@app.post('/customers',status_code=201)
def create_customer(payload:CustomerWrite,request:Request,u:User=Depends(require_permission('customers','write')),db:Session=Depends(get_db)):
 return service_create_customer(db,u,payload,request)

@app.get('/dashboard/summary')
def dashboard(u:User=Depends(current_user),db:Session=Depends(get_db)):
 return dashboard_summary(db,u.organization_id)

@app.get('/leads')
def leads(u:User=Depends(require_permission('leads','read')),db:Session=Depends(get_db)):
 rows=db.query(Lead).filter(Lead.organization_id==u.organization_id).order_by(Lead.created_at.desc()).all();return [{'id':x.id,'company':x.company,'contactName':x.contact_name,'status':x.status,'value':float(x.value)} for x in rows]

@app.post('/v1/email/classify')
def classify_email(payload:EmailRequest):
 return classify_email_service(payload.subject,payload.body).model_dump()
