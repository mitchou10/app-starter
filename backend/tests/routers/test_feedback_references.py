import uuid

import httpx2

TYPES = "/api/feedback-types"
STATUSES = "/api/feedback-statuses"
ADMIN_TYPES = "/api/admin/feedback-types"
ADMIN_STATUSES = "/api/admin/feedback-statuses"


async def named(client: httpx2.AsyncClient, url: str, name: str) -> dict:
    return next(item for item in (await client.get(url)).json() if item["name"] == name)


# ---- reading


async def test_everybody_logged_in_reads_the_types_in_their_order(client, login) -> None:
    login()
    response = await client.get(TYPES)
    assert response.status_code == 200
    types = response.json()
    assert [t["name"] for t in types] == ["Bug", "Suggestion", "Question", "Other"]
    assert [t["position"] for t in types] == [1, 2, 3, 4]
    assert types[0] | {"id": None} == {
        "id": None,
        "name": "Bug",
        "description": "Something does not work as it should.",
        "tone": "red",
        "position": 1,
        "created_by": None,
        "created_by_username": None,
        "created_at": types[0]["created_at"],
        "archived": False,
    }


async def test_the_statuses_say_which_ones_are_final_and_which_the_app_uses(client, login) -> None:
    login()
    statuses = (await client.get(STATUSES)).json()
    assert [s["key"] for s in statuses] == ["new", "review", "planned", "progress", "done", "wontfix", "closed"]
    assert {s["key"] for s in statuses if s["is_closed"]} == {"done", "wontfix", "closed"}


async def test_reading_needs_a_login(client) -> None:
    assert (await client.get(TYPES)).status_code == 401
    assert (await client.get(STATUSES)).status_code == 401


# ---- who may change them


async def test_a_user_cannot_add_or_change_anything(client, login) -> None:
    login(admin=False)
    bug = await named(client, TYPES, "Bug")
    assert (await client.post(ADMIN_TYPES, json={"name": "Praise"})).status_code == 403
    assert (await client.patch(f"{ADMIN_TYPES}/{bug['id']}", json={"name": "Defect"})).status_code == 403
    assert (await client.post(ADMIN_STATUSES, json={"name": "Merged"})).status_code == 403
    assert (await client.patch(f"{ADMIN_STATUSES}/{uuid.uuid4()}", json={"name": "x"})).status_code == 403
    assert (await named(client, TYPES, "Bug"))["name"] == "Bug"


async def test_nobody_logged_out_changes_anything(client) -> None:
    assert (await client.post(ADMIN_TYPES, json={"name": "Praise"})).status_code == 401


# ---- types


async def test_an_admin_adds_a_type_and_it_says_who_and_when(client, login) -> None:
    login("admin-1", "grace", admin=True)
    response = await client.post(
        ADMIN_TYPES, json={"name": "  Praise ", "description": "Something you like.", "tone": "green"}
    )
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Praise"  # trimmed
    assert (created["tone"], created["position"], created["archived"]) == ("green", 5, False)
    assert (created["created_by"], created["created_by_username"]) == ("admin-1", "grace")
    assert created["created_at"]
    assert (await named(client, TYPES, "Praise"))["id"] == created["id"]


async def test_a_new_type_goes_last_and_defaults_to_gray(client, login) -> None:
    login(admin=True)
    await client.post(ADMIN_TYPES, json={"name": "A"})
    second = (await client.post(ADMIN_TYPES, json={"name": "B"})).json()
    assert (second["position"], second["tone"], second["description"]) == (6, "gray", "")


async def test_a_name_is_unique_whatever_its_case(client, login) -> None:
    login(admin=True)
    for name in ("Bug", "bug", "  BUG  "):
        response = await client.post(ADMIN_TYPES, json={"name": name})
        assert response.status_code == 409, name


async def test_a_type_needs_a_name_and_a_known_color(client, login) -> None:
    login(admin=True)
    assert (await client.post(ADMIN_TYPES, json={"name": "   "})).status_code == 422
    assert (await client.post(ADMIN_TYPES, json={})).status_code == 422
    assert (await client.post(ADMIN_TYPES, json={"name": "x" * 61})).status_code == 422
    assert (await client.post(ADMIN_TYPES, json={"name": "Odd", "tone": "pink"})).status_code == 422


async def test_an_admin_renames_recolors_and_reorders_a_type(client, login) -> None:
    login(admin=True)
    bug = await named(client, TYPES, "Bug")
    response = await client.patch(f"{ADMIN_TYPES}/{bug['id']}", json={"name": "Defect", "tone": "amber", "position": 9})
    assert response.status_code == 200
    assert (response.json()["name"], response.json()["tone"], response.json()["position"]) == ("Defect", "amber", 9)
    assert response.json()["description"] == bug["description"]  # not sent: unchanged
    assert [t["name"] for t in (await client.get(TYPES)).json()][-1] == "Defect"


async def test_renaming_to_a_name_taken_is_refused_but_changing_only_the_case_is_fine(client, login) -> None:
    login(admin=True)
    bug = await named(client, TYPES, "Bug")
    assert (await client.patch(f"{ADMIN_TYPES}/{bug['id']}", json={"name": "question"})).status_code == 409
    assert (await client.patch(f"{ADMIN_TYPES}/{bug['id']}", json={"name": "BUG"})).status_code == 200


async def test_archiving_a_type_keeps_it_listed_but_flagged_and_it_can_be_restored(client, login) -> None:
    login(admin=True)
    other = await named(client, TYPES, "Other")
    archived = await client.patch(f"{ADMIN_TYPES}/{other['id']}", json={"archived": True})
    assert archived.json()["archived"] is True
    assert (await named(client, TYPES, "Other"))["archived"] is True  # still there: old feedback shows its name
    restored = await client.patch(f"{ADMIN_TYPES}/{other['id']}", json={"archived": False})
    assert restored.json()["archived"] is False


async def test_an_unknown_type_is_a_404_and_a_bad_id_a_422(client, login) -> None:
    login(admin=True)
    assert (await client.patch(f"{ADMIN_TYPES}/{uuid.uuid4()}", json={"name": "x"})).status_code == 404
    assert (await client.patch(f"{ADMIN_TYPES}/not-a-uuid", json={"name": "x"})).status_code == 422


# ---- statuses


async def test_an_admin_adds_a_closed_status(client, login) -> None:
    login("admin-1", "grace", admin=True)
    response = await client.post(ADMIN_STATUSES, json={"name": "Duplicate", "tone": "gray", "is_closed": True})
    assert response.status_code == 201
    created = response.json()
    assert (created["is_closed"], created["position"], created["key"]) == (True, 8, None)
    assert created["created_by_username"] == "grace"


async def test_a_status_can_become_final_or_not(client, login) -> None:
    login(admin=True)
    review = await named(client, STATUSES, "In review")
    response = await client.patch(f"{ADMIN_STATUSES}/{review['id']}", json={"is_closed": True})
    assert response.json()["is_closed"] is True


async def test_the_statuses_the_app_uses_cannot_be_archived_but_can_be_renamed(client, login) -> None:
    login(admin=True)
    for name in ("New", "Closed"):
        status = await named(client, STATUSES, name)
        assert (await client.patch(f"{ADMIN_STATUSES}/{status['id']}", json={"archived": True})).status_code == 409
        renamed = await client.patch(f"{ADMIN_STATUSES}/{status['id']}", json={"name": f"{name} (renamed)"})
        assert renamed.status_code == 200
        assert renamed.json()["key"] == status["key"]  # found by its key, not by its name


async def test_any_other_status_can_be_archived(client, login) -> None:
    login(admin=True)
    review = await named(client, STATUSES, "In review")
    assert (await client.patch(f"{ADMIN_STATUSES}/{review['id']}", json={"archived": True})).json()["archived"] is True


async def test_status_names_are_unique_too(client, login) -> None:
    login(admin=True)
    assert (await client.post(ADMIN_STATUSES, json={"name": "done"})).status_code == 409
