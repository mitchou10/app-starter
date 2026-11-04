"""create user profiles

Revision ID: bb21210e55ef
Revises:
Create Date: 2026-11-04 13:16:06.345069
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "bb21210e55ef"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("avatar_key", sa.String(length=512), nullable=True),
        sa.Column("avatar_content_type", sa.String(length=100), nullable=True),
        sa.Column("avatar_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_user_profiles")),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
