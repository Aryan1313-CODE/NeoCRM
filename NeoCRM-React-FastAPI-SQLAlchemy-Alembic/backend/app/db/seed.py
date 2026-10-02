from sqlalchemy import select
from app.db.session import SessionLocal
from app.models import *
from app.core.security import hash_password
ORG_ID='00000000-0000-0000-0000-000000000001'
PERMS=[('dashboard','read'),('customers','read'),('customers','write'),('leads','read'),('deals','read'),('products','read'),('quotes','read'),('orders','read'),('compliance','read'),('analytics','read'),('tasks','read'),('users','read'),('users','write'),('organization','read'),('organization','write'),('audit','read')]
ROLE_PERMS={'admin':[f'{r}:{a}' for r,a in PERMS],'sales_manager':['dashboard:read','customers:read','customers:write','leads:read','deals:read','products:read','quotes:read','orders:read','compliance:read','analytics:read','tasks:read'],'sales':['dashboard:read','customers:read','customers:write','leads:read','deals:read','products:read','quotes:read','tasks:read'],'inventory':['dashboard:read','products:read','orders:read','compliance:read'],'auditor':['dashboard:read','audit:read']}
def seed():
 db=SessionLocal()
 try:
  org=db.get(Organization,ORG_ID)
  if not org: org=Organization(id=ORG_ID,name='Chemora Chemicals',industry='Chemical Manufacturing & Distribution',location='Bengaluru, India',currency='INR'); db.add(org); db.flush()
  pmap={}
  for r,a in PERMS:
   p=db.execute(select(Permission).where(Permission.resource==r,Permission.action==a)).scalar_one_or_none()
   if not p: p=Permission(resource=r,action=a); db.add(p); db.flush()
   pmap[f'{r}:{a}']=p
  rmap={}
  for rn in ROLE_PERMS:
   role=db.execute(select(Role).where(Role.name==rn)).scalar_one_or_none()
   if not role: role=Role(name=rn,description=f'{rn} role'); db.add(role); db.flush()
   rmap[rn]=role
   for key in ROLE_PERMS[rn]:
    if not db.get(RolePermission,{'role_id':role.id,'permission_id':pmap[key].id}): db.add(RolePermission(role_id=role.id,permission_id=pmap[key].id))
  pwd=hash_password('Admin@123')
  users=[('Riddima Singh','admin@chemora.com','admin'),('Amit Verma','amit@chemora.com','sales'),('Neha Kapoor','neha@chemora.com','inventory'),('Audit User','audit@chemora.com','auditor')]
  for name,email,rn in users:
   u=db.execute(select(User).where(User.email==email)).scalar_one_or_none()
   if not u: u=User(name=name,email=email,password_hash=pwd,organization_id=ORG_ID,status='ACTIVE'); db.add(u); db.flush()
   if not db.get(UserRole,{'user_id':u.id,'role_id':rmap[rn].id}): db.add(UserRole(user_id=u.id,role_id=rmap[rn].id))
  if db.query(Customer).filter(Customer.organization_id==ORG_ID).count()==0:
   db.add_all([Customer(organization_id=ORG_ID,name='Riddima Singh',company='Reliance Industries',type='Customer',industry='Chemicals',location='Mumbai'),Customer(organization_id=ORG_ID,name='Aarti Shah',company='Aarti Chemicals',type='Customer',industry='Specialty Chemicals',location='Mumbai'),Customer(organization_id=ORG_ID,name='Rahul Mehta',company='Galaxy Surfactants',type='Supplier',industry='Surfactants',location='Mumbai'),Customer(organization_id=ORG_ID,name='Neha Kapoor',company='Galaxy Surfactants',type='Customer',industry='Surfactants',location='Mumbai',status='Inactive')])
  if db.query(Lead).filter(Lead.organization_id==ORG_ID).count()==0:
   db.add_all([Lead(organization_id=ORG_ID,company='Reliance Industries',contact_name='Amit Verma',status='QUALIFIED',value=42000000),Lead(organization_id=ORG_ID,company='Aarti Chemicals',contact_name='Priya Shah',status='NEGOTIATION',value=28000000),Lead(organization_id=ORG_ID,company='Acme Petrochem',contact_name='Karan Mehta',status='NEGOTIATION',value=19000000),Lead(organization_id=ORG_ID,company='UPL Ltd.',contact_name='Sneha Iyer',status='WON',value=16000000),Lead(organization_id=ORG_ID,company='Tata Chemicals',contact_name='Vikram Rao',status='NEW',value=12000000),Lead(organization_id=ORG_ID,company='SRF Ltd.',contact_name='Neha Kapoor',status='LOST',value=7000000)])
  if db.query(Quote).filter(Quote.organization_id==ORG_ID).count()==0:
   db.add_all([Quote(organization_id=ORG_ID,customer_name='Aarti Chemicals',status='SENT',amount=8500000),Quote(organization_id=ORG_ID,customer_name='Reliance Industries',status='SENT',amount=12000000),Quote(organization_id=ORG_ID,customer_name='Tata Chemicals',status='ACCEPTED',amount=6400000),Quote(organization_id=ORG_ID,customer_name='UPL Ltd.',status='SENT',amount=5100000)])
  db.commit()
  print('Seed complete. Admin login: admin@chemora.com / Admin@123')
 finally: db.close()
if __name__=='__main__': seed()
