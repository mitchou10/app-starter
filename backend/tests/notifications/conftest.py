import pytest

from app.config import settings
from tests.notifications.helpers import KEY, OTHER_KEY


@pytest.fixture(autouse=True)
def emitters(monkeypatch: pytest.MonkeyPatch) -> None:
    """Two applications may emit: `billing` and `reports`."""
    monkeypatch.setattr(settings, "NOTIFICATION_API_KEYS", f"billing={KEY}, reports={OTHER_KEY}")
