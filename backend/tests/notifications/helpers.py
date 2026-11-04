import httpx2

KEY = "billing-key-0123456789"
OTHER_KEY = "reports-key-9876543210"
EMIT = "/api/emit/notifications"
NOTIFICATIONS = "/api/notifications"


async def emit(
    client: httpx2.AsyncClient,
    users: list[str],
    *,
    title: str = "Invoice ready",
    description: str = "Your invoice is available.",
    url: str | None = None,
    key: str = KEY,
) -> httpx2.Response:
    """What another application does: tells users something, with its key."""
    body: dict = {"user_ids": users, "title": title, "description": description}
    if url is not None:
        body["url"] = url
    return await client.post(EMIT, json=body, headers={"X-Api-Key": key})
