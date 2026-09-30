from alembic import op
import sqlalchemy as sa


revision = "0002_integrity_indexes"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    # Existing rows were inspected before introducing these checks/indexes.
    op.create_check_constraint("ck_users_status", "users", "status IN ('ACTIVE', 'INACTIVE')")
    op.create_check_constraint("ck_customers_status", "customers", "status IN ('Active', 'Inactive')")
    op.create_check_constraint("ck_audit_logs_result", "audit_logs", "result IN ('SUCCESS', 'DENIED', 'ERROR')")
    op.create_index("ix_users_org_created", "users", ["organization_id", "created_at"])
    op.create_index("ix_customers_org_created", "customers", ["organization_id", "created_at"])
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)


def downgrade():
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_index("ix_customers_org_created", table_name="customers")
    op.drop_index("ix_users_org_created", table_name="users")
    op.drop_constraint("ck_audit_logs_result", "audit_logs", type_="check")
    op.drop_constraint("ck_customers_status", "customers", type_="check")
    op.drop_constraint("ck_users_status", "users", type_="check")
