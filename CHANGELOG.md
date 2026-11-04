# Changelog

## [0.2.0](https://github.com/mitchou10/app-starter/compare/v0.1.0...v0.2.0) (2026-11-04)


### Features

* **backend:** add PostgreSQL, SQLAlchemy and Alembic migrations ([a867dfb](https://github.com/mitchou10/app-starter/commit/a867dfb0dfe20a3170e8091f9e0917c0e89ba22c))
* **backend:** store the profile photo in RustFS, with its reference in PostgreSQL ([80bf46c](https://github.com/mitchou10/app-starter/commit/80bf46cfc144fa9100dbbf8b40a1faabf2080e62))
* **frontend:** add the profile photo to the settings page and the sidebar ([54dcf0a](https://github.com/mitchou10/app-starter/commit/54dcf0a73f4eec96928e84c6e142b75680b5c602))


### Code Refactoring

* **backend:** use pydantic models for the auth context, sessions and responses ([5c2fcd2](https://github.com/mitchou10/app-starter/commit/5c2fcd26a6f5bf92ba972e4605a3696389cc09c8))

## 0.1.0 (2026-11-04)


### Features

* add backend, frontend and CI/CD template ([783d383](https://github.com/mitchou10/app-starter/commit/783d3831f914fdea519cb2a462cf071618ad5691))
* add OIDC BFF authentication ([e3670a5](https://github.com/mitchou10/app-starter/commit/e3670a59f0cf61c3128638cdd40c077f2ab44d21))
* **frontend:** add a landing page and routing with a protected route ([5a1d868](https://github.com/mitchou10/app-starter/commit/5a1d86898e08721c469cfe7b83b039f975055e50))
* **frontend:** add an app layout with a sidebar and a profile menu ([815716e](https://github.com/mitchou10/app-starter/commit/815716ed119693cb6af6f5e89d831f325a210abb))
* **frontend:** add reusable layout components and a language dropdown ([29218e5](https://github.com/mitchou10/app-starter/commit/29218e50c110838f5b010e2bc49f594aba00ba58))
* rebuild the frontend with React, Tailwind, shadcn/ui and i18next ([401b41c](https://github.com/mitchou10/app-starter/commit/401b41c928190511ae7bb7cd8f2738d9e9f153e8))
* style the Keycloak login page like the frontend ([5e0b488](https://github.com/mitchou10/app-starter/commit/5e0b48809aa4f80dd17dbaa05a7aa1cfb363ed79))


### Bug Fixes

* **frontend:** track src/lib, ignored by the root .gitignore ([cf96985](https://github.com/mitchou10/app-starter/commit/cf969858e403f92e42ce23f1663ccbe8637bbe32))


### Dependencies

* add react-router to the frontend ([ccca7ef](https://github.com/mitchou10/app-starter/commit/ccca7ef1aeb0489d08f59339b7e83df9f9550de9))
* **frontend:** add the shadcn sidebar, dropdown menu and avatar components ([ecb0897](https://github.com/mitchou10/app-starter/commit/ecb0897c78e29422d6455014b38c75d1c6e52ee7))
* replace httpx with httpx2 and bump backend dependencies ([a79c906](https://github.com/mitchou10/app-starter/commit/a79c9060890b384cf05415f4562f577455d09333))
