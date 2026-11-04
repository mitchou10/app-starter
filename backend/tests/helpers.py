"""What the feedback tests share: tiny images and a few calls that read like the story of the test."""

import httpx2

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32


def shot(name: str = "shot.png", data: bytes = PNG, content_type: str = "image/png") -> tuple:
    """One file for a multipart request: `files=[shot(), shot("b.png")]`."""
    return ("files", (name, data, content_type))


async def ref_id(client: httpx2.AsyncClient, kind: str, name: str) -> str:
    """The id of a type (`kind="types"`) or of a status (`kind="statuses"`) by its name."""
    items = (await client.get(f"/api/feedback-{kind}")).json()
    return next(item["id"] for item in items if item["name"] == name)


async def send(
    client: httpx2.AsyncClient,
    *,
    title: str = "It is broken",
    description: str = "Details.",
    type_name: str = "Bug",
    page: str | None = None,
    files: list | None = None,
) -> dict:
    """Sends a feedback as the logged-in user and returns it (the call must succeed)."""
    data = {"title": title, "description": description, "type_id": await ref_id(client, "types", type_name)}
    if page is not None:
        data["page"] = page
    response = await client.post("/api/feedback", data=data, files=files or None)
    assert response.status_code == 201, response.text
    return response.json()


async def answer(
    client: httpx2.AsyncClient, feedback_id: str, body: str = "An answer.", files: list | None = None
) -> dict:
    response = await client.post(f"/api/feedback/{feedback_id}/messages", data={"body": body}, files=files or None)
    assert response.status_code == 201, response.text
    return response.json()


async def move(client: httpx2.AsyncClient, feedback_id: str, status_name: str) -> httpx2.Response:
    status_id = await ref_id(client, "statuses", status_name)
    return await client.patch(f"/api/feedback/{feedback_id}", json={"status_id": status_id})
