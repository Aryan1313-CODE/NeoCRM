import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Organization, Permission, Role, RolePermission, User, UserRole


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    db = TestingSession()
    org = Organization(
        id="00000000-0000-0000-0000-000000000001",
        name="Chemora Chemicals",
        industry="Chemicals",
        location="Bengaluru",
        currency="INR",
    )
    admin_role = Role(name="admin", description="Admin")
    reader_role = Role(name="reader", description="Read only")
    sales_role = Role(name="sales", description="Sales")
    db.add_all([org, admin_role, reader_role, sales_role])
    permissions = {}
    for resource, action in [
        ("users", "read"), ("users", "write"),
        ("organization", "read"), ("organization", "write"),
        ("audit", "read"), ("customers", "read"), ("customers", "write"),
        ("leads", "read"), ("dashboard", "read"),
    ]:
        permissions[(resource, action)] = Permission(resource=resource, action=action)
    db.add_all(permissions.values())
    db.flush()
    for permission in permissions.values():
        db.add(RolePermission(role_id=admin_role.id, permission_id=permission.id))
    for key in [("customers", "read"), ("dashboard", "read")]:
        db.add(RolePermission(role_id=reader_role.id, permission_id=permissions[key].id))
    admin = User(
        id="admin-user", organization_id=org.id, name="Admin User",
        email="admin@chemora.com", password_hash=hash_password("Admin@123"), status="ACTIVE",
    )
    reader = User(
        id="reader-user", organization_id=org.id, name="Reader User",
        email="reader@chemora.com", password_hash=hash_password("Reader@123"), status="ACTIVE",
    )
    db.add_all([admin, reader])
    db.flush()
    db.add_all([
        UserRole(user_id=admin.id, role_id=admin_role.id),
        UserRole(user_id=reader.id, role_id=reader_role.id),
    ])
    db.commit()

    def override_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
    db.close()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def admin_headers(client):
    response = client.post("/auth/login", json={"email": "admin@chemora.com", "password": "Admin@123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def reader_headers(client):
    response = client.post("/auth/login", json={"email": "reader@chemora.com", "password": "Reader@123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
