# Changelog

## [0.2.0](https://github.com/mitchou10/app-starter/compare/backend-v0.1.0...backend-v0.2.0) (2026-11-04)


### Features

* **backend:** add PostgreSQL, SQLAlchemy and Alembic migrations ([a867dfb](https://github.com/mitchou10/app-starter/commit/a867dfb0dfe20a3170e8091f9e0917c0e89ba22c))
* **backend:** store the profile photo in RustFS, with its reference in PostgreSQL ([80bf46c](https://github.com/mitchou10/app-starter/commit/80bf46cfc144fa9100dbbf8b40a1faabf2080e62))


### Code Refactoring

* **backend:** use pydantic models for the auth context, sessions and responses ([5c2fcd2](https://github.com/mitchou10/app-starter/commit/5c2fcd26a6f5bf92ba972e4605a3696389cc09c8))

## 0.1.0 (2026-11-04)


### Features

* add backend, frontend and CI/CD template ([783d383](https://github.com/mitchou10/app-starter/commit/783d3831f914fdea519cb2a462cf071618ad5691))
* add OIDC BFF authentication ([e3670a5](https://github.com/mitchou10/app-starter/commit/e3670a59f0cf61c3128638cdd40c077f2ab44d21))


### Dependencies

* replace httpx with httpx2 and bump backend dependencies ([a79c906](https://github.com/mitchou10/app-starter/commit/a79c9060890b384cf05415f4562f577455d09333))
