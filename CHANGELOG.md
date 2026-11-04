# Changelog

## [0.5.0](https://github.com/mitchou10/app-starter/compare/v0.4.0...v0.5.0) (2026-11-04)


### Features

* **backend:** add the notifications table ([d9ab94a](https://github.com/mitchou10/app-starter/commit/d9ab94ab0e09bcbf3c9ffb1dfb57cf86a2149245))
* **backend:** let applications emit notifications and users read them ([66a3221](https://github.com/mitchou10/app-starter/commit/66a3221ba447c6fefeab8a79351a25d0e07db4fe))
* **frontend:** add the notifications page and the badge on the avatar ([d4177ad](https://github.com/mitchou10/app-starter/commit/d4177ad0ef7450c28b93ca9413c7e2ef19946120))


### Code Refactoring

* **frontend:** share the API client and the error messages ([0df72b1](https://github.com/mitchou10/app-starter/commit/0df72b1239bf106130c6d9d46967bb3179d6d83b))

## [0.4.0](https://github.com/mitchou10/app-starter/compare/v0.3.0...v0.4.0) (2026-11-04)


### Features

* add a plain user to the Keycloak realm ([dc31a19](https://github.com/mitchou10/app-starter/commit/dc31a19605a02a1cfdd5052f6205e8e2f97f7766))
* **frontend:** add a favicon ([e7a2baa](https://github.com/mitchou10/app-starter/commit/e7a2baa95180bd0696bd337f6088925988e42ed2))
* **frontend:** add the feedback screens, on an in-memory mock ([de0a69d](https://github.com/mitchou10/app-starter/commit/de0a69d101b3df69f41201e0bf13c26d3b6b529d))
* **frontend:** add the layer that talks to the feedback API ([9df20ca](https://github.com/mitchou10/app-starter/commit/9df20ca54fffe08cc6692f225288a666983bef5b))
* **frontend:** open Give feedback with Ctrl+Shift+F and attach the page the user is on ([9a5aa25](https://github.com/mitchou10/app-starter/commit/9a5aa256da576e3b374d967ec0038de03014d93e))
* **frontend:** read and write the feedback through the API ([8415cc5](https://github.com/mitchou10/app-starter/commit/8415cc5da1c95249a14a4ca15de90f155301388c))
* **frontend:** scroll the follow-up on its own and paginate the feedback list ([6bef123](https://github.com/mitchou10/app-starter/commit/6bef1230cb20cd80febcb5d2759d48df1391ec68))


### Code Refactoring

* **frontend:** one feedback page per side, with the list and the detail together ([5ef0d19](https://github.com/mitchou10/app-starter/commit/5ef0d19b7c7e91aa86f79aab8e423746fa825376))


### Dependencies

* **frontend:** add TanStack Query ([a6d188f](https://github.com/mitchou10/app-starter/commit/a6d188f80f4f3c21e5cdedde1f6df5de270cdfc8))
* **frontend:** add the shadcn dialog, textarea, badge, table, label and tabs components ([287fb7a](https://github.com/mitchou10/app-starter/commit/287fb7a2712f9e9bb27ac0c08103e5c23e17a830))

## [0.3.0](https://github.com/mitchou10/app-starter/compare/v0.2.0...v0.3.0) (2026-11-04)


### Features

* **backend:** add the feedback tables with their default types and statuses ([63694c9](https://github.com/mitchou10/app-starter/commit/63694c957c49e57dbeb468c928b58f104870f793))
* **backend:** list, add, change and archive the feedback types and statuses ([0d606e8](https://github.com/mitchou10/app-starter/commit/0d606e83f1bfa16d6102a92c34a66f709b8bc842))
* **backend:** send feedback with screenshots, follow it and list it ([403fe76](https://github.com/mitchou10/app-starter/commit/403fe76386cd1e132d74cd60dd01b8307b0072da))


### Code Refactoring

* **backend:** share the image checks and group the service errors ([f72f28f](https://github.com/mitchou10/app-starter/commit/f72f28f64128911ec4c1049135646c779aa59237))


### Dependencies

* **backend:** measure the code that runs in greenlets ([a9adde6](https://github.com/mitchou10/app-starter/commit/a9adde65b44086a70c6b2ad3f0e806fd1b5b6cc2))

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
