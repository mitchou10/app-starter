# Changelog

## [0.4.0](https://github.com/mitchou10/app-starter/compare/backend-v0.3.0...backend-v0.4.0) (2026-11-04)


### Features

* **backend:** add the notifications table ([d9ab94a](https://github.com/mitchou10/app-starter/commit/d9ab94ab0e09bcbf3c9ffb1dfb57cf86a2149245))
* **backend:** let applications emit notifications and users read them ([66a3221](https://github.com/mitchou10/app-starter/commit/66a3221ba447c6fefeab8a79351a25d0e07db4fe))

## [0.3.0](https://github.com/mitchou10/app-starter/compare/backend-v0.2.0...backend-v0.3.0) (2026-11-04)


### Features

* **backend:** add the feedback tables with their default types and statuses ([63694c9](https://github.com/mitchou10/app-starter/commit/63694c957c49e57dbeb468c928b58f104870f793))
* **backend:** list, add, change and archive the feedback types and statuses ([0d606e8](https://github.com/mitchou10/app-starter/commit/0d606e83f1bfa16d6102a92c34a66f709b8bc842))
* **backend:** send feedback with screenshots, follow it and list it ([403fe76](https://github.com/mitchou10/app-starter/commit/403fe76386cd1e132d74cd60dd01b8307b0072da))


### Code Refactoring

* **backend:** share the image checks and group the service errors ([f72f28f](https://github.com/mitchou10/app-starter/commit/f72f28f64128911ec4c1049135646c779aa59237))


### Dependencies

* **backend:** measure the code that runs in greenlets ([a9adde6](https://github.com/mitchou10/app-starter/commit/a9adde65b44086a70c6b2ad3f0e806fd1b5b6cc2))

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
