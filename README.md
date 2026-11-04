# app-starter

Template for new applications: a FastAPI backend, a Vue frontend, and a CI/CD built on the reusable
workflows of [Mitchou10/github-workflow](https://github.com/Mitchou10/github-workflow).

```
backend/    FastAPI + uv        (own version, own CHANGELOG.md)
frontend/   Vue + Vite + pnpm   (own version, own CHANGELOG.md)
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
