def test_login_success(client):
    response = client.post("/auth/login", json={"email": "admin@chemora.com", "password": "Admin@123"})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_failure(client):
    response = client.post("/auth/login", json={"email": "admin@chemora.com", "password": "wrong"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_request_validation_is_consistent(client):
    response = client.post("/auth/login", json={"email": "not-an-email", "password": ""})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert "fields" in response.json()["error"]


def test_auth_me(client, admin_headers):
    response = client.get("/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@chemora.com"


def test_logout_revokes_session(client, admin_headers):
    assert client.post("/auth/logout", headers=admin_headers).status_code == 200
    assert client.get("/auth/me", headers=admin_headers).status_code == 401


def test_revoked_session_is_rejected(client, admin_headers):
    client.post("/auth/logout", headers=admin_headers)
    assert client.get("/customers", headers=admin_headers).status_code == 401


def test_rbac_denies_user_management(client, reader_headers):
    assert client.get("/users", headers=reader_headers).status_code == 403


def test_user_listing(client, admin_headers):
    response = client.get("/users", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_user_creation(client, admin_headers):
    response = client.post("/users", headers=admin_headers, json={
        "name": "New User", "email": "new@chemora.com", "role": "sales", "status": "Active",
    })
    assert response.status_code == 201
    assert response.json()["email"] == "new@chemora.com"


def test_user_email_is_case_insensitive_unique(client, admin_headers):
    response = client.post("/users", headers=admin_headers, json={
        "name": "Duplicate", "email": "ADMIN@chemora.com", "role": "sales", "status": "Active",
    })
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"


def test_organization_access(client, admin_headers):
    response = client.get("/organization", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Chemora Chemicals"


def test_organization_update(client, admin_headers):
    response = client.put("/organization", headers=admin_headers, json={
        "name": "Chemora India", "industry": "Chemicals", "location": "Bengaluru", "currency": "inr",
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Chemora India"
    assert response.json()["currency"] == "INR"


def test_audit_log_is_created(client, admin_headers):
    client.post("/users", headers=admin_headers, json={
        "name": "New User", "email": "new@chemora.com", "role": "sales", "status": "Active",
    })
    response = client.get("/audit", headers=admin_headers)
    assert response.status_code == 200
    assert any(row["resource"] == "User" for row in response.json())


def test_customer_listing(client, admin_headers):
    assert client.get("/customers", headers=admin_headers).json() == []


def test_customer_creation(client, admin_headers):
    response = client.post("/customers", headers=admin_headers, json={
        "name": "A Customer", "company": "Acme", "type": "Customer",
        "industry": "Chemicals", "location": "Mumbai",
    })
    assert response.status_code == 201
    assert response.json()["company"] == "Acme"


def test_dashboard_summary(client, admin_headers):
    response = client.get("/dashboard/summary", headers=admin_headers)
    assert response.status_code == 200
    assert response.json() == {
        "totalCustomers": 0, "activeLeads": 0, "pipelineValue": 0.0,
        "quotesSent": 0, "conversionRate": 0,
    }


def test_email_classification_output_is_validated(client):
    response = client.post("/v1/email/classify", json={"subject": "Pricing request", "body": "Need a quote"})
    assert response.status_code == 200
    assert response.json()["category"] == "SALES_INQUIRY"
    assert 0 <= response.json()["confidence"] <= 1


def test_invalid_audit_pagination_returns_validation_error(client, admin_headers):
    response = client.get("/audit?page=0", headers=admin_headers)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_seed_roles_only_reference_defined_permissions():
    from app.db.seed import PERMS, ROLE_PERMS

    defined = {f"{resource}:{action}" for resource, action in PERMS}
    assert set(ROLE_PERMS) == {"admin", "sales_manager", "sales", "inventory", "auditor"}
    assert all(set(grants) <= defined for grants in ROLE_PERMS.values())
    assert set(ROLE_PERMS["admin"]) == defined
