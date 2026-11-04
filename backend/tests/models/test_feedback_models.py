import uuid

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Feedback, FeedbackMessage, FeedbackStatus, FeedbackType
from app.models.feedback_message import COMMENT, STATUS_CHANGE
from app.models.feedback_status import CLOSED, NEW, PROTECTED_KEYS


async def one(db: AsyncSession, model, **where):
    return (await db.execute(select(model).filter_by(**where))).scalar_one()


async def make_feedback(db: AsyncSession) -> Feedback:
    feedback = Feedback(
        title="t",
        description="d",
        type_id=(await one(db, FeedbackType, name="Bug")).id,
        status_id=(await one(db, FeedbackStatus, key=NEW)).id,
        created_by="u1",
        created_by_username="ada",
    )
    db.add(feedback)
    await db.commit()
    return feedback


# ---- what the migration ships


async def test_the_migration_ships_the_default_types(db: AsyncSession) -> None:
    types = (await db.execute(select(FeedbackType).order_by(FeedbackType.position))).scalars().all()
    assert [t.name for t in types] == ["Bug", "Suggestion", "Question", "Other"]
    assert [t.position for t in types] == [1, 2, 3, 4]
    assert all(t.created_by is None and not t.archived and t.tone for t in types)


async def test_the_migration_ships_the_default_statuses_in_order(db: AsyncSession) -> None:
    statuses = (await db.execute(select(FeedbackStatus).order_by(FeedbackStatus.position))).scalars().all()
    assert [s.key for s in statuses] == ["new", "review", "planned", "progress", "done", "wontfix", "closed"]
    assert [s.position for s in statuses] == [1, 2, 3, 4, 5, 6, 7]
    assert {s.key for s in statuses if s.is_closed} == {"done", "wontfix", CLOSED}
    assert {NEW, CLOSED} == set(PROTECTED_KEYS)


async def test_the_default_ids_are_the_same_everywhere(db: AsyncSession) -> None:
    bug = await one(db, FeedbackType, name="Bug")
    assert bug.id == uuid.uuid5(uuid.NAMESPACE_URL, "feedback-type:Bug")
    new = await one(db, FeedbackStatus, key=NEW)
    assert new.id == uuid.uuid5(uuid.NAMESPACE_URL, "feedback-status:new")


# ---- what the database refuses


async def test_a_name_is_unique(db: AsyncSession) -> None:
    db.add(FeedbackType(name="Bug"))
    with pytest.raises(IntegrityError):
        await db.commit()


async def test_a_tone_must_be_one_of_the_known_colors(db: AsyncSession) -> None:
    db.add(FeedbackType(name="Odd", tone="pink"))
    with pytest.raises(IntegrityError):
        await db.commit()


async def test_a_status_key_is_unique_but_not_required(db: AsyncSession) -> None:
    db.add_all([FeedbackStatus(name="A"), FeedbackStatus(name="B")])  # no key: allowed twice
    await db.commit()
    db.add(FeedbackStatus(name="C", key=NEW))
    with pytest.raises(IntegrityError):
        await db.commit()


async def test_an_answer_needs_a_body_and_has_no_new_status(db: AsyncSession) -> None:
    fid = (await make_feedback(db)).id  # kept: a rollback expires the objects
    db.add(FeedbackMessage(feedback_id=fid, kind=COMMENT, body="", author_id="u", author_username="u"))
    with pytest.raises(IntegrityError):
        await db.commit()
    await db.rollback()
    new = await one(db, FeedbackStatus, key=NEW)
    db.add(
        FeedbackMessage(
            feedback_id=fid, kind=COMMENT, body="hi", new_status_id=new.id, author_id="u", author_username="u"
        )
    )
    with pytest.raises(IntegrityError):
        await db.commit()


async def test_a_change_of_status_says_which_status_it_moved_to(db: AsyncSession) -> None:
    fid = (await make_feedback(db)).id
    db.add(FeedbackMessage(feedback_id=fid, kind=STATUS_CHANGE, author_id="u", author_username="u"))
    with pytest.raises(IntegrityError):
        await db.commit()
    await db.rollback()
    closed = await one(db, FeedbackStatus, key=CLOSED)
    db.add(
        FeedbackMessage(
            feedback_id=fid, kind=STATUS_CHANGE, new_status_id=closed.id, author_id="u", author_username="u"
        )
    )
    await db.commit()  # fine


async def test_a_kind_must_be_known(db: AsyncSession) -> None:
    feedback = await make_feedback(db)
    db.add(FeedbackMessage(feedback_id=feedback.id, kind="shout", body="x", author_id="u", author_username="u"))
    with pytest.raises(IntegrityError):
        await db.commit()


async def test_a_type_in_use_cannot_be_deleted(db: AsyncSession) -> None:
    feedback = await make_feedback(db)
    with pytest.raises(IntegrityError):
        await db.execute(text("DELETE FROM feedback_types WHERE id = :id"), {"id": feedback.type_id})


async def test_deleting_a_feedback_deletes_its_follow_up(db: AsyncSession) -> None:
    feedback = await make_feedback(db)
    db.add(FeedbackMessage(feedback_id=feedback.id, kind=COMMENT, body="hi", author_id="u", author_username="u"))
    await db.commit()
    await db.execute(text("DELETE FROM feedbacks WHERE id = :id"), {"id": feedback.id})
    await db.commit()
    assert (await db.execute(text("SELECT count(*) FROM feedback_messages"))).scalar_one() == 0
