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
cd backend && uv sync && uv run pytest
cd frontend && pnpm install && pnpm test
```

## Frontend

React 19 + TypeScript on Vite, styled with [Tailwind CSS](https://tailwindcss.com) 4 and
[shadcn/ui](https://ui.shadcn.com) (components are copied into `src/components/ui`, so they are yours to edit).

- Add a component: `cd frontend && pnpm dlx shadcn@latest add dialog`.
- Translations: [react-i18next](https://react.i18next.com), files in `src/i18n/locales/` (`en`, `fr`). The language
  is the saved choice, else the browser's, else English. Add a language by adding its file and listing it in
  `src/i18n/index.ts`.
- `/api` is proxied to the backend (`BACKEND_URL`), so the session cookie stays on the page's own origin.

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
