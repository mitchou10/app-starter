"""create notifications

Revision ID: c83b3b37ca24
Revises: 57939e548771
Create Date: 2026-11-04 15:27:42.592159
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c83b3b37ca24"
down_revision: str | None = "57939e548771"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("source", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "url IS NULL OR (url LIKE '/%' AND url NOT LIKE '//%') OR url LIKE 'http://%' OR url LIKE 'https://%'",
            name=op.f("ck_notifications_url"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_index(
        "ix_notifications_unread",
        "notifications",
        ["user_id"],
        unique=False,
        postgresql_where=sa.text("read_at IS NULL"),
    )
    op.create_index("ix_notifications_user_id_created_at", "notifications", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id_created_at", table_name="notifications")
    op.drop_index("ix_notifications_unread", table_name="notifications", postgresql_where=sa.text("read_at IS NULL"))
    op.drop_table("notifications")
