from alembic import op
import sqlalchemy as sa

revision = "0003_customer_lead_workflows"
down_revision = "0002_integrity_indexes"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("customers", sa.Column("parent_customer_id", sa.String(36), nullable=True))
    op.create_foreign_key("fk_customers_parent_customer", "customers", "customers", ["parent_customer_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_customers_parent_customer_id", "customers", ["parent_customer_id"])
    for name, coltype in (("email", sa.String(320)), ("phone", sa.String(40)), ("source", sa.String(80)), ("description", sa.Text()), ("customer_id", sa.String(36)), ("owner_user_id", sa.String(36))):
        op.add_column("leads", sa.Column(name, coltype, nullable=True))
    op.create_foreign_key("fk_leads_customer", "leads", "customers", ["customer_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_leads_owner", "leads", "users", ["owner_user_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_leads_customer_id", "leads", ["customer_id"])
    op.create_index("ix_leads_owner_user_id", "leads", ["owner_user_id"])
    op.add_column("leads", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_leads_deleted_at", "leads", ["deleted_at"])
    for table, ref_name, ref_table, lead_fields in (("customer_activities", "customer_id", "customers", False), ("lead_activities", "lead_id", "leads", True)):
        cols = [sa.Column("id", sa.String(36), primary_key=True), sa.Column("organization_id", sa.String(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False), sa.Column(ref_name, sa.String(36), sa.ForeignKey(f"{ref_table}.id", ondelete="CASCADE"), nullable=False), sa.Column("actor_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("kind", sa.String(30), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("notes", sa.Text())]
        if lead_fields:
            cols.extend([sa.Column("due_at", sa.DateTime(timezone=True)), sa.Column("completed_at", sa.DateTime(timezone=True))])
        cols.append(sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
        op.create_table(table, *cols)
        op.create_index(f"ix_{table}_organization_id", table, ["organization_id"])
        op.create_index(f"ix_{table}_{ref_name}", table, [ref_name])


def downgrade():
    op.drop_table("lead_activities")
    op.drop_table("customer_activities")
    op.drop_index("ix_leads_deleted_at", table_name="leads")
    op.drop_column("leads", "deleted_at")
    for name in ("ix_leads_owner_user_id", "ix_leads_customer_id"):
        op.drop_index(name, table_name="leads")
    op.drop_constraint("fk_leads_owner", "leads", type_="foreignkey")
    op.drop_constraint("fk_leads_customer", "leads", type_="foreignkey")
    for name in ("owner_user_id", "customer_id", "description", "source", "phone", "email"):
        op.drop_column("leads", name)
    op.drop_index("ix_customers_parent_customer_id", table_name="customers")
    op.drop_constraint("fk_customers_parent_customer", "customers", type_="foreignkey")
    op.drop_column("customers", "parent_customer_id")
