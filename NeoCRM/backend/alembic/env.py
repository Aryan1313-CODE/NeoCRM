import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool, text
from alembic import context

# Load app config and models
from app.core.config import settings
from app.db.session import Base

# Import all models so autogenerate detects them
import app.models  # noqa: F401

config = context.config

# Override sqlalchemy.url from application settings (respects .env)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()

        # Enforce append-only on audit_logs after migration (ADD Standard 1 / Ch.5 §5.11)
        # The app role must not have UPDATE/DELETE on these tables.
        # This is idempotent — safe to run every migration.
        _apply_append_only_privileges(connection)


def _apply_append_only_privileges(connection) -> None:
    """
    Revoke UPDATE/DELETE from the application role on append-only tables.
    ADD Standard 1: No UPDATE/DELETE grant for the application role at the
    database privilege level (Ch.5 §5.11 D16, Ch.8 §8.4.4 D30).
    """
    append_only_tables = ["audit_logs"]
    db_user = os.getenv("DB_APP_ROLE", "neocrm")
    for table in append_only_tables:
        try:
            connection.execute(
                text(f"REVOKE UPDATE, DELETE ON TABLE {table} FROM {db_user}")
            )
        except Exception:
            # Role may not exist in dev — skip silently
            pass


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
