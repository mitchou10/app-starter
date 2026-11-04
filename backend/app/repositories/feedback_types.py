from app.models import FeedbackType
from app.repositories.reference import ReferenceRepository


class FeedbackTypeRepository(ReferenceRepository[FeedbackType]):
    model = FeedbackType
