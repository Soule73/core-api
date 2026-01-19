# Core API

NestJS REST API for the CustomDash platform - Microservices architecture for CRUD operations.

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Testing**: Vitest (unit & E2E)

## Installation

```bash
yarn install
cp .env.example .env
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=customdash
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=7d
PORT=3002
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

## Scripts

```bash
yarn start:dev      # Development mode
yarn build          # Production build
yarn start:prod     # Production mode
yarn test           # Unit tests
yarn test:e2e       # E2E tests
yarn lint           # Linting
yarn format         # Formatting
yarn release        # New version
```

## Structure

```
src/
├── common/           # Decorators, filters, guards, interceptors
├── config/           # Configuration (database, jwt)
├── database/         # Seeder and DB module
└── modules/
    ├── auth/         # JWT Authentication
    ├── users/        # User management
    ├── roles/        # Roles and permissions management
    ├── dashboards/   # Dashboards CRUD
    ├── widgets/      # Widgets CRUD
    ├── datasources/  # Data sources
    └── ai-conversations/  # AI Conversations
```

## API Endpoints

Base URL: `/api/v1`

| Module      | Endpoints                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------- |
| Auth        | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                                    |
| Users       | `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`                      |
| Roles       | `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id`                         |
| Dashboards  | `GET /dashboards`, `POST /dashboards`, `PATCH /dashboards/:id`, `DELETE /dashboards/:id`     |
| Widgets     | `GET /widgets`, `POST /widgets`, `PATCH /widgets/:id`, `DELETE /widgets/:id`                 |
| DataSources | `GET /datasources`, `POST /datasources`, `PATCH /datasources/:id`, `DELETE /datasources/:id` |
| AI          | `GET /ai/conversations`, `POST /ai/conversations`, `PATCH /ai/conversations/:id`             |

## Tests

- **97 unit tests** passing
- **107 E2E tests** passing

```bash
yarn test           # Unit tests
yarn test:e2e       # E2E tests
yarn test:cov       # Coverage
```

## Decorators

```typescript
@Public()                           // Public route
@CurrentUser()                      // Connected user
@RequirePermissions('user:read')    // Permission check
```

## Conventional Commits

```bash
yarn commit     # Interactive wizard
yarn release    # Generate version + CHANGELOG
```

## License

UNLICENSED - Private project

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
