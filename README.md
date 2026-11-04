# app-starter

Template for new applications: a FastAPI backend, a React frontend, and a CI/CD built on the reusable
workflows of [Mitchou10/github-workflow](https://github.com/Mitchou10/github-workflow).

```
backend/    FastAPI + uv        (own version, own CHANGELOG.md)
frontend/   React + Vite + pnpm + Tailwind + shadcn/ui + i18next   (own version, own CHANGELOG.md)
.github/
  workflows/ci.yml       pull requests: lint, types, tests, scans, image builds, one `gate` check
  workflows/release.yml  release-please, then image build + scan + dev sync
  releases/              release-please configs and manifests (stable on main, rc on dev)
```

## Using the template

1. Click **Use this template** (or copy the folder), then rename `app-backend` / `app-frontend`
   in `backend/pyproject.toml`, `frontend/package.json` and `.github/releases/*.json`.
2. Settings → Actions → General: **Read and write permissions** and **Allow GitHub Actions to create and approve pull requests**.
3. Create the `dev` branch from `main`.
4. Branch protection on `main` and `dev`: require the single `gate` check.
5. Optional: add `APP_CLIENT_ID` / `APP_PRIVATE_KEY` secrets and uncomment `secrets:` in `release.yml`
   so release PRs trigger the CI.

## Local development

```bash
docker compose up --build     # backend :8000, frontend :5173
cd backend && uv sync && uv run pytest   # needs the test database, see Backend > Tests
cd frontend && pnpm install && pnpm test
```

## Backend

FastAPI, fully async (SQLAlchemy 2 + asyncpg, aioboto3), with small layers that each only know the one below:

```
app/routers/        HTTP only: read the request, call a service, build the response (deps.py wires a service together)
app/schemas/        pydantic models of what goes out (and in): no logic, no database
app/services/       the rules: no HTTP, no SQL. Raise their own errors (services/errors.py), routers map them to HTTP
app/repositories/   the database, nothing else (one class per table)
app/models/         SQLAlchemy tables (Base, UserProfile)
app/storage/        object storage: an ObjectStore interface and its S3 implementation, nothing else knows about S3
app/auth/           login (OIDC BFF), sessions, the current user
app/config.py       every setting, from the environment (pydantic-settings)
migrations/         Alembic
```

**Add a feature**: a model (and a migration), a repository, a service, a schema, a router, one line in `main.py`.
Pydantic models are used at every border (settings, requests, responses, the current user, sessions).

### Database and migrations

PostgreSQL, `DATABASE_URL=postgresql+asyncpg://user:password@host:5432/db`. The schema only changes through Alembic:

```bash
cd backend
uv run alembic revision --autogenerate -m "add something"   # after changing a model, then read the file
uv run alembic upgrade head
uv run alembic check                                          # fails if the models and the migrations differ
```

With `docker compose up`, the `migrate` service brings the database to the latest migration before the backend starts.

### Object storage

RustFS in development, any S3-compatible service in production. The usual `AWS_*` variables:
`AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, plus `AWS_BUCKET` (the bucket is
created on first use). RustFS console: http://localhost:9001 (`rustfsadmin` / `rustfsadmin`).

### Feedback API

Users send feedback and follow it; admins answer and move it forward. The data model is drawn in
[docs/data-model.png](docs/data-model.png) (`uv run python scripts/draw_model.py`, needs Graphviz's `dot`, after a model
change).

| Who | Route |
| --- | --- |
| Everybody | `GET /api/feedback-types`, `GET /api/feedback-statuses` (archived ones included, flagged) |
| | `POST /api/feedback` (multipart: `title`, `description`, `type_id`, `page`, `files`) |
| | `GET /api/feedback` (mine), `GET /api/feedback/{id}`, `PATCH /api/feedback/{id}` (status, type) |
| | `GET`, `POST /api/feedback/{id}/messages`, `GET /api/feedback/{id}/attachments/{id}` |
| Admins | `GET /api/admin/feedback` (all of it) |
| | `POST`, `PATCH /api/admin/feedback-types` and `/api/admin/feedback-statuses` |

- **Visibility**: a feedback is seen by its author and by admins; for anybody else it does not exist (404).
- **Changes**: admins change the status and the type freely. An author can only close their feedback (status
  `closed`) or reopen it (`new`). Every change of status is written in the follow-up, between the answers.
- **Types and statuses are data**: the migration ships the defaults, admins add, rename, recolor, reorder and archive
  them (an archived value stays on its feedback but cannot be chosen again). The statuses with the keys `new` and
  `closed` are used by the app itself: they can be renamed, never archived.
- **Screenshots**: up to 5 per feedback or answer, PNG, JPEG or WebP of 5 MB at most, checked on their bytes, all
  of them before any is stored. They are in the object storage and served by the API, to whoever may see the feedback.
- **Pagination**: the list takes `limit` (1 to 50), `offset`, `status` (an id, or `open` for every status that is not
  final) and `type_id`, and answers `{items, total, limit, offset}`. The follow-up is read from the newest message:
  `limit` and `before` (the `next_before` of the previous page, an opaque cursor), and answers
  `{items, total, next_before}` with the items oldest first. The cursor holds `(created_at, id)`: a message added
  meanwhile moves nothing.
- **Errors** are raised by the services (`services/errors.py`) and turned into status codes in one place,
  `routers/errors.py`.

### Profile photo

`GET /api/me/profile`, then `GET` / `PUT` / `DELETE /api/me/avatar`. PNG, JPEG or WebP, 2 MB at most
(`AVATAR_MAX_BYTES`): the type is read from the bytes, not from what the client says, and SVG is refused. The image
is in the bucket under `avatars/<user>/<random>`, the database holds its key. In the frontend: the settings page, and
the profile at the bottom of the sidebar.

### Tests

They run against a real PostgreSQL (the schema is built by the migrations) and a simulated S3:

```bash
docker compose -f docker-compose.test.yaml up -d --wait     # PostgreSQL on :55433
cd backend && uv run pytest --cov
```

## Frontend

React 19 + TypeScript on Vite, styled with [Tailwind CSS](https://tailwindcss.com) 4 and
[shadcn/ui](https://ui.shadcn.com) (components are copied into `src/components/ui`, so they are yours to edit).

- Add a component: `cd frontend && pnpm dlx shadcn@latest add dialog`.
- Translations: [react-i18next](https://react.i18next.com), files in `src/i18n/locales/` (`en`, `fr`). The language
  is the saved choice, else the browser's, else English. Add a language by adding its file and listing it in
  `src/i18n/index.ts`.
- `/api` is proxied to the backend (`BACKEND_URL`), so the session cookie stays on the page's own origin.

### Structure, routing and layouts

```
src/routes.tsx         every route of the app, in one place
src/layouts/           RootLayout (public header + footer), AppLayout (sidebar), appNav.ts (sidebar entries)
src/pages/             one file per page (AppHomePage, SettingsPage, NotFoundPage)
src/auth/              AuthProvider (who is logged in, asked once), RequireAuth (protects routes)
src/components/        generic and reusable: Container, Section, SectionHeading, UserMenu, LanguageSwitcher...
src/components/ui/     shadcn/ui (generated, edit freely)
src/features/landing/  the home page: one small component per file, everything comes from props
  content.ts           the list of features (icon + key)
  LandingPage.tsx      only assembles the sections
```

Two worlds, like ChatGPT's site and app:

- **Public** (`RootLayout`): the landing page and the 404, with a header on top and a footer. The header holds
  the language dropdown and a "Sign in" button (or "Open the app" once logged in).
- **App** (`AppLayout`, behind `RequireAuth`): for logged-in users only. A sidebar on the left (a drawer on mobile)
  with the navigation, and the **profile at the bottom**: click it for a menu with the settings, the language and
  sign out. A visitor who is not logged in gets a sign-in button that brings them back to the page they asked for.
  There is no content yet: `/app` is empty on purpose, it is where your product starts.

[React Router](https://reactrouter.com). **Add a page of the app**: create it in `src/pages` (or `src/features/<name>`),
add a line under `AppLayout` in `routes.tsx` and an entry in `layouts/appNav.ts` for the sidebar. **Add a public
page**: a line under `RootLayout` (and a link in `layouts/nav.ts` if it belongs in the header, which has none for
now). Unknown addresses show the 404 page; nginx falls back to `index.html` so a refresh on any route works.

Components stay small, take their texts as props and know nothing about i18n; only the pages, the layouts,
`UserMenu` and `AuthButton` call `t()`. To adapt the landing page in a new project: edit the texts in
`src/i18n/locales/*.json`, the list in `content.ts`, and add or remove sections in `LandingPage.tsx`.

### Feedback module (mockups)

Users send feedback (title, description, type, screenshots) from their profile menu and follow it in **My feedback**;
admins answer and move it forward. The screens are built in `src/features/feedback/` on an **in-memory mock**
(`FeedbackProvider`, with sample data in `mock/data.ts`): nothing is saved, a reload starts again. Each function of the
mock becomes a call to the backend later; the screens only use `useFeedback()`.

- Profile menu: *Give feedback* (a dialog), *My feedback*, and for admins an *Administration* group (all feedback,
  types and statuses). The sidebar stays light on purpose.
- Types and statuses are data, not code: an admin adds, edits or archives them. An author can close or reopen their own
  feedback; only admins change the status or the type.
- To see it: `docker compose up` (the `dev` user of the Keycloak realm is an admin), or run the backend with
  `AUTH_MODE=full-access` and `pnpm dev` with `BACKEND_URL` pointing to it.

## Authentication (BFF)

The backend is a BFF: the browser never sees a token. `/api/auth/login` sends it to the identity provider
(authorization code + PKCE), `/api/auth/callback` trades the code for tokens that stay in a server-side session,
and the browser only holds an opaque HttpOnly cookie. Non-browser clients can send `Authorization: Bearer <token>`.

| Route | Role |
| --- | --- |
| `GET /api/auth/login?redirect=/path` | start the login (only internal paths are accepted) |
| `GET /api/auth/callback` | end of the login, creates the session |
| `GET /api/auth/me` | the current user (`401` when logged out) |
| `POST /api/auth/logout` | ends the session, returns the provider's `logout_url` |

In a route: `async def route(user: CurrentUser)` (`from app.auth.deps import CurrentUser`).

Nothing in the code is tied to Keycloak. It speaks standard OIDC through [Authlib](https://authlib.org) and is
configured by `OIDC_*` variables (see `backend/app/config.py`); Keycloak only appears in `docker-compose.yaml`
and `docker/keycloak/realm-app.json` (user `dev` / `dev`). To use another provider, change `OIDC_ISSUER`, the client
credentials and, if the provider names them differently, `OIDC_ROLES_CLAIM` / `OIDC_GROUPS_CLAIM`
(dotted path for nested claims, e.g. `realm_access.roles`).

- `AUTH_MODE=full-access` disables authentication: every request is a fixed dev user (no provider needed, used by tests).
- Sessions live in memory (`app/auth/session.py`): implement the `SessionStore` protocol on Redis or a database
  before running several replicas.

### Login page theme

The Keycloak login page is restyled like the frontend: `docker/keycloak/themes/app/login/` extends Keycloak's
login theme with a small CSS. The colors, radius and font are the frontend's (`frontend/src/style.css`), copied by
`node docker/keycloak/sync-theme.mjs`: run it after changing the frontend's theme. The realm uses it
(`"loginTheme": "app"` in `realm-app.json`) and `docker-compose.yaml` mounts the folder, with Keycloak's theme cache
off so that a CSS edit shows up on reload.

The realm is only imported when it does not exist yet: on an already running Keycloak, recreate it
(`docker compose down && docker compose up -d`) or pick the theme in the admin console
(Realm settings → Themes → Login theme: `app`). Other providers have their own way to theme the login page: this
folder is specific to Keycloak and can be dropped with it.

## Releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). release-please opens **one** release
pull request per branch (`dev`: release candidates `-rc.N`, `main`: stable) that bumps:

| Release | Tag | Changelog | Bumped when |
| --- | --- | --- | --- |
| Global | `vX.Y.Z` | `CHANGELOG.md` | any change in the repo |
| Backend | `backend-vX.Y.Z` | `backend/CHANGELOG.md` | a commit touches `backend/` |
| Frontend | `frontend-vX.Y.Z` | `frontend/CHANGELOG.md` | a commit touches `frontend/` |

Service versions are written to `backend/pyproject.toml` (and `uv.lock`) and `frontend/package.json`.
Container images (`ghcr.io/<owner>/<repo>-backend` and `-frontend`) are built and scanned on each global release,
tagged with the global version.

Attribution is by file path, not by commit scope: a commit appears in the changelog of every service whose folder it touches, and always in the global one.
