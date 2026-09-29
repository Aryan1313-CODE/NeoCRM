"""
Database seeder — runs on startup if no organization exists.
Creates the first org, default roles/permissions, and the superadmin user.
"""
import uuid
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.role import Permission, Role
from app.models.user import User

# All platform permissions — deny-by-default (ADD Standard 3)
DEFAULT_PERMISSIONS = [
    ("users:read",         "View users"),
    ("users:create",       "Create users"),
    ("users:update",       "Update users"),
    ("users:delete",       "Deactivate users"),
    ("organization:read",  "View organization"),
    ("organization:update","Update organization settings"),
    ("audit:read",         "View audit logs"),
    ("roles:read",         "View roles and permissions"),
    ("roles:manage",       "Manage roles and permissions"),
    # CRM permissions (Weeks 2–4)
    ("customers:read",     "View customers"),
    ("customers:create",   "Create customers"),
    ("customers:update",   "Update customers"),
    ("leads:read",         "View leads"),
    ("leads:create",       "Create leads"),
    ("leads:update",       "Update leads"),
    ("leads:delete",       "Delete leads"),
    ("quotations:read",    "View quotations"),
    ("quotations:create",  "Create quotations"),
    ("quotations:update",  "Update quotations"),
    ("pipeline:manage",    "Manage pipeline stages"),
]

# System roles — each starts from zero and adds explicitly (ADD Standard 3)
DEFAULT_ROLES = {
    "superadmin": {
        "description": "Full platform access — system managed",
        "permissions": [p[0] for p in DEFAULT_PERMISSIONS],
        "is_system": True,
    },
    "admin": {
        "description": "Organization administration",
        "permissions": [
            "users:read", "users:create", "users:update", "users:delete",
            "organization:read", "organization:update",
            "audit:read", "roles:read",
        ],
        "is_system": True,
    },
    "sales_head": {
        "description": "Sales leadership — full CRM + pricing approval",
        "permissions": [
            "customers:read", "customers:create", "customers:update",
            "leads:read", "leads:create", "leads:update", "leads:delete",
            "quotations:read", "quotations:create", "quotations:update",
            "pipeline:manage",
        ],
        "is_system": True,
    },
    "sales_rep": {
        "description": "Sales representative — CRM read/create",
        "permissions": [
            "customers:read", "customers:create",
            "leads:read", "leads:create", "leads:update",
            "quotations:read", "quotations:create",
        ],
        "is_system": True,
    },
}


def seed_database(db: Session) -> None:
    # Check if already seeded
    if db.query(Organization).first():
        return

    print("🌱 Seeding database with initial data...")

    # 1. Create organization
    slug = settings.FIRST_ORG_NAME.lower().replace(" ", "-")
    org = Organization(
        id=str(uuid.uuid4()),
        name=settings.FIRST_ORG_NAME,
        slug=slug,
    )
    db.add(org)
    db.flush()

    # 2. Create permissions
    perm_map: dict[str, Permission] = {}
    for action, description in DEFAULT_PERMISSIONS:
        perm = Permission(id=str(uuid.uuid4()), action=action, description=description)
        db.add(perm)
        perm_map[action] = perm
    db.flush()

    # 3. Create roles and attach permissions
    role_map: dict[str, Role] = {}
    for role_name, role_config in DEFAULT_ROLES.items():
        role = Role(
            id=str(uuid.uuid4()),
            name=role_name,
            description=role_config["description"],
            is_system=role_config["is_system"],
            permissions=[perm_map[p] for p in role_config["permissions"] if p in perm_map],
        )
        db.add(role)
        role_map[role_name] = role
    db.flush()

    # 4. Create superadmin user
    admin = User(
        id=str(uuid.uuid4()),
        email=settings.FIRST_SUPERADMIN_EMAIL,
        hashed_password=hash_password(settings.FIRST_SUPERADMIN_PASSWORD),
        full_name="System Administrator",
        is_superadmin=True,
        organization_id=org.id,
        roles=[role_map["superadmin"]],
    )
    db.add(admin)
    db.commit()

    print(f"✅ Seeded org='{org.name}', admin='{admin.email}'")
    print(f"   Default password: {settings.FIRST_SUPERADMIN_PASSWORD}")
    print("   ⚠️  Change this password immediately in production!")
