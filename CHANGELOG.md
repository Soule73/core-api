# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/Soule73/core-api/compare/v1.0.0...v1.1.0) (2026-01-22)


### Features

* **config:** add Redis configuration and register ProcessingModule ([9c5c7f5](https://github.com/Soule73/core-api/commit/9c5c7f5b6fa20479f8fc0376b313f268052337dd))
* **e2e:** add test fixtures for processing module e2e tests ([8102647](https://github.com/Soule73/core-api/commit/8102647f8cbe1175bdfb2fa5e556c730950d4f49))
* **processing:** add aggregation engine with 5 aggregation types ([9aa0e1f](https://github.com/Soule73/core-api/commit/9aa0e1fcb346b71ae7c74d9e805d5310fd48dcd3))
* **processing:** add data connectors for JSON, CSV and Elasticsearch ([13dcd21](https://github.com/Soule73/core-api/commit/13dcd214fa664c2235182b934d26eb84b51327a1))
* **processing:** add filter engine with 14 operators ([25d6ec9](https://github.com/Soule73/core-api/commit/25d6ec95e62f27032c24c61ed5ad38817be3f6ec))
* **processing:** add group-by transformer for data bucketing ([5e6dfc8](https://github.com/Soule73/core-api/commit/5e6dfc8e577ea993573ddd137ce547c9914308d1))
* **processing:** add Processing module with controller and services ([03924b8](https://github.com/Soule73/core-api/commit/03924b86ef318fcf60a8c1c62affc925499c4afd))
* **processing:** add schema analyzer for data source introspection ([b0bc96b](https://github.com/Soule73/core-api/commit/b0bc96b5c41cab40d635f07906ca283d1f8a6e03))


### Bug Fixes

* **ai-conversations:** remove redundant userId from CreateAIConversationDto ([7faf01d](https://github.com/Soule73/core-api/commit/7faf01dc951c0493bf1e4021fd26d153830e0603))


### Code Refactoring

* **tests:** migrate test folder structure to e2e/ ([2b2824d](https://github.com/Soule73/core-api/commit/2b2824d97aab125aa6793b68af10cffc9697516f))


### Build System

* **docker:** update Dockerfiles for E2E test environment ([6dccec9](https://github.com/Soule73/core-api/commit/6dccec99cfd1702e788c3180eab437b21572c3c7))


### Documentation

* add CONTRIBUTING.md with guidelines ([293f93a](https://github.com/Soule73/core-api/commit/293f93a9295966606ab00d6d4adfc5095482a2e0))
* **postman:** update collection with Processing module endpoints ([b31c167](https://github.com/Soule73/core-api/commit/b31c167564ede0dac0909ad1f19d52ff37ff082b))
* simplify README with essential information ([0847c9e](https://github.com/Soule73/core-api/commit/0847c9ef425a85b09f8a6605362d77936f904d56))
* update README and add E2E testing documentation ([7a795fd](https://github.com/Soule73/core-api/commit/7a795fdf1ea7b4bc9beb1e82821d918760e593c3))

## 1.0.0 (2026-01-18)

### Features

- **ai,auth:** add AI conversations and auth modules ([d9ac9e6](https://github.com/Soule73/core-api/commit/d9ac9e60ffcefa515c500d081608fb04aa900322))
- **config:** add common utilities (decorators, filters, interceptors) and configuration ([00ce30d](https://github.com/Soule73/core-api/commit/00ce30d4e308de806f10b811da4a77da53063a75))
- **dashboards:** add dashboards module with sharing capabilities ([b7975f6](https://github.com/Soule73/core-api/commit/b7975f6e1c4f567011006d2cb8fda7a41ec43b91))
- **database:** add database seeder for dev environment ([799f4cb](https://github.com/Soule73/core-api/commit/799f4cb342997b3b728131effe1b5cb5768bb1a9))
- **users,roles:** add users and roles modules with CRUD operations ([fec0b62](https://github.com/Soule73/core-api/commit/fec0b62712c11b1e2e7c5983e56162258d03ad16))
- **widgets,datasources:** add widgets and datasources modules ([f5e0c3d](https://github.com/Soule73/core-api/commit/f5e0c3d19aeedfaf9cf122a541a8d83a6f350f41))

### Bug Fixes

- **config:** configure GitHub URLs for changelog generation ([6748f8b](https://github.com/Soule73/core-api/commit/6748f8b734344465bd5a1b88a270de45c5eb919d))

### Documentation

- **config:** add Swagger/OpenAPI documentation with health endpoint and unit tests ([0f4d783](https://github.com/Soule73/core-api/commit/0f4d783daa408cc190b68da6638c19f4a82df534))

### Code Refactoring

- **common:** update decorators, interfaces, filters and interceptors ([d522b0b](https://github.com/Soule73/core-api/commit/d522b0bb4b8c3a813e2a0ba0e690ee6b6ab02cca))
- **core:** update config, main and app module structure ([e6349e1](https://github.com/Soule73/core-api/commit/e6349e13caa4008fd0a1ade745d024ed8cd016a9))

### Tests

- add E2E tests and test helpers for all modules ([50d55a4](https://github.com/Soule73/core-api/commit/50d55a4e8cc68d2549a01f09e8e3795d6a50c315))
- **tests:** migrate from Jest to Vitest with E2E tests and helpers ([dd37cf9](https://github.com/Soule73/core-api/commit/dd37cf91be6a81993a5d5b0842212711ba04e4f6))
