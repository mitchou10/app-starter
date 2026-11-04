"""create the feedback module

Revision ID: 57939e548771
Revises: bb21210e55ef
Create Date: 2026-11-04 14:26:41.575489
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "57939e548771"
down_revision: str | None = "bb21210e55ef"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# The values every installation starts with. The ids are derived from the names, so they are the same everywhere.
# created_by stays empty: they come from the app, not from a person.
TYPES = [
    ("Bug", "Something does not work as it should.", "red"),
    ("Suggestion", "An idea to improve the app.", "blue"),
    ("Question", "You need help or an explanation.", "violet"),
    ("Other", "Anything else.", "gray"),
]
# key, name, description, tone, is_closed. `new` and `closed` are used by the app itself (see models/feedback_status.py).
STATUSES = [
    ("new", "New", "Waiting to be read.", "blue", False),
    ("review", "In review", "The team is looking at it.", "amber", False),
    ("planned", "Planned", "Accepted, not started yet.", "violet", False),
    ("progress", "In progress", "Being worked on.", "amber", False),
    ("done", "Done", "Delivered.", "green", True),
    ("wontfix", "Won't fix", "Refused.", "gray", True),
    ("closed", "Closed", "Closed by its author.", "gray", True),
]


def _id(kind: str, name: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"feedback-{kind}:{name}")


def _seed() -> None:
    types = sa.table(
        "feedback_types",
        sa.column("id", sa.Uuid()),
        sa.column("name"),
        sa.column("description"),
        sa.column("tone"),
        sa.column("position"),
    )
    statuses = sa.table(
        "feedback_statuses",
        sa.column("id", sa.Uuid()),
        sa.column("key"),
        sa.column("name"),
        sa.column("description"),
        sa.column("tone"),
        sa.column("is_closed"),
        sa.column("position"),
    )
    op.bulk_insert(
        types,
        [
            {"id": _id("type", n), "name": n, "description": d, "tone": t, "position": i}
            for i, (n, d, t) in enumerate(TYPES, start=1)
        ],
    )
    op.bulk_insert(
        statuses,
        [
            {"id": _id("status", k), "key": k, "name": n, "description": d, "tone": t, "is_closed": c, "position": i}
            for i, (k, n, d, t, c) in enumerate(STATUSES, start=1)
        ],
    )


def upgrade() -> None:
    op.create_table(
        "feedback_statuses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("key", sa.String(length=30), nullable=True),
        sa.Column("is_closed", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("description", sa.String(length=500), server_default="", nullable=False),
        sa.Column("tone", sa.String(length=20), server_default="gray", nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=True),
        sa.Column("created_by_username", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "tone IN ('gray', 'blue', 'green', 'amber', 'red', 'violet')", name=op.f("ck_feedback_statuses_tone")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feedback_statuses")),
        sa.UniqueConstraint("key", name=op.f("uq_feedback_statuses_key")),
        sa.UniqueConstraint("name", name=op.f("uq_feedback_statuses_name")),
    )
    op.create_table(
        "feedback_types",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("description", sa.String(length=500), server_default="", nullable=False),
        sa.Column("tone", sa.String(length=20), server_default="gray", nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=True),
        sa.Column("created_by_username", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "tone IN ('gray', 'blue', 'green', 'amber', 'red', 'violet')", name=op.f("ck_feedback_types_tone")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feedback_types")),
        sa.UniqueConstraint("name", name=op.f("uq_feedback_types_name")),
    )
    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("type_id", sa.Uuid(), nullable=False),
        sa.Column("status_id", sa.Uuid(), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_by_username", sa.String(length=255), nullable=False),
        sa.Column("page_path", sa.String(length=2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["status_id"], ["feedback_statuses.id"], name=op.f("fk_feedbacks_status_id_feedback_statuses")
        ),
        sa.ForeignKeyConstraint(["type_id"], ["feedback_types.id"], name=op.f("fk_feedbacks_type_id_feedback_types")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feedbacks")),
    )
    op.create_index(op.f("ix_feedbacks_created_by"), "feedbacks", ["created_by"], unique=False)
    op.create_index(op.f("ix_feedbacks_status_id"), "feedbacks", ["status_id"], unique=False)
    op.create_index(op.f("ix_feedbacks_type_id"), "feedbacks", ["type_id"], unique=False)
    op.create_index("ix_feedbacks_updated_at", "feedbacks", ["updated_at"], unique=False)
    op.create_table(
        "feedback_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("feedback_id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("body", sa.Text(), server_default="", nullable=False),
        sa.Column("author_id", sa.String(length=255), nullable=False),
        sa.Column("author_username", sa.String(length=255), nullable=False),
        sa.Column("author_is_staff", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("old_status_id", sa.Uuid(), nullable=True),
        sa.Column("new_status_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "(kind = 'status_change') = (new_status_id IS NOT NULL)",
            name=op.f("ck_feedback_messages_status_change_has_new_status"),
        ),
        sa.CheckConstraint("kind <> 'comment' OR length(body) > 0", name=op.f("ck_feedback_messages_comment_has_body")),
        sa.CheckConstraint("kind IN ('comment', 'status_change')", name=op.f("ck_feedback_messages_kind")),
        sa.ForeignKeyConstraint(
            ["feedback_id"],
            ["feedbacks.id"],
            name=op.f("fk_feedback_messages_feedback_id_feedbacks"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["new_status_id"],
            ["feedback_statuses.id"],
            name=op.f("fk_feedback_messages_new_status_id_feedback_statuses"),
        ),
        sa.ForeignKeyConstraint(
            ["old_status_id"],
            ["feedback_statuses.id"],
            name=op.f("fk_feedback_messages_old_status_id_feedback_statuses"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feedback_messages")),
    )
    op.create_index(
        "ix_feedback_messages_feedback_id_created_at", "feedback_messages", ["feedback_id", "created_at"], unique=False
    )
    op.create_table(
        "feedback_attachments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("feedback_id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=True),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["feedback_id"],
            ["feedbacks.id"],
            name=op.f("fk_feedback_attachments_feedback_id_feedbacks"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["feedback_messages.id"],
            name=op.f("fk_feedback_attachments_message_id_feedback_messages"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feedback_attachments")),
    )
    op.create_index(op.f("ix_feedback_attachments_feedback_id"), "feedback_attachments", ["feedback_id"], unique=False)
    op.create_index(op.f("ix_feedback_attachments_message_id"), "feedback_attachments", ["message_id"], unique=False)
    _seed()


def downgrade() -> None:
    op.drop_index(op.f("ix_feedback_attachments_message_id"), table_name="feedback_attachments")
    op.drop_index(op.f("ix_feedback_attachments_feedback_id"), table_name="feedback_attachments")
    op.drop_table("feedback_attachments")
    op.drop_index("ix_feedback_messages_feedback_id_created_at", table_name="feedback_messages")
    op.drop_table("feedback_messages")
    op.drop_index("ix_feedbacks_updated_at", table_name="feedbacks")
    op.drop_index(op.f("ix_feedbacks_type_id"), table_name="feedbacks")
    op.drop_index(op.f("ix_feedbacks_status_id"), table_name="feedbacks")
    op.drop_index(op.f("ix_feedbacks_created_by"), table_name="feedbacks")
    op.drop_table("feedbacks")
    op.drop_table("feedback_types")
    op.drop_table("feedback_statuses")
