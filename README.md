# Core API

NestJS REST API for the CustomDash platform - Microservices architecture for CRUD operations.

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Testing**: Vitest (unit & E2E)
- **Data Sources**: JSON, CSV, Elasticsearch

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
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Scripts

```bash
yarn start:dev      # Development mode
yarn build          # Production build
yarn start:prod     # Production mode
yarn test           # Unit tests
yarn test:e2e       # E2E tests
yarn docker:e2e:up  # Start E2E Docker environment
yarn docker:e2e:down # Stop E2E Docker environment
yarn lint           # Linting
yarn format         # Formatting
yarn release        # New version
```

## Structure

```
src/
├── common/           # Decorators, filters, guards, interceptors
├── config/           # Configuration (database, jwt, redis)
├── database/         # Seeder and DB module
└── modules/
    ├── auth/         # JWT Authentication
    ├── users/        # User management
    ├── roles/        # Roles and permissions management
    ├── dashboards/   # Dashboards CRUD
    ├── widgets/      # Widgets CRUD
    ├── datasources/  # Data sources
    ├── ai-conversations/  # AI Conversations
    └── processing/   # Data processing (fetch, aggregate, filter, analyze)
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
| Processing  | `GET /processing/datasources/:id/data`, `POST /processing/datasources/:id/aggregate`         |

## Processing Module

The Processing module provides data fetching, aggregation, filtering, and schema analysis capabilities.

### Endpoints

| Method | Endpoint                                   | Description                   |
| ------ | ------------------------------------------ | ----------------------------- |
| GET    | `/processing/datasources/:id/data`         | Fetch data from a data source |
| POST   | `/processing/datasources/:id/aggregate`    | Aggregate data with metrics   |
| POST   | `/processing/detect-columns`               | Detect columns from config    |
| GET    | `/processing/datasources/:id/schema`       | Full schema analysis          |
| GET    | `/processing/datasources/:id/quick-schema` | Quick analysis (types only)   |

### Connectors

- **JSON**: HTTP endpoints with bearer, apiKey, or basic auth
- **CSV**: Local files or remote URLs
- **Elasticsearch**: ES 8.x clusters with query support

### Aggregation Types

- `sum`, `avg`, `count`, `min`, `max`

### Filter Operators

- Equality: `equals`, `not_equals`
- Text: `contains`, `not_contains`, `regex`
- Comparison: `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`
- Range: `between`, `in`, `not_in`
- Null: `is_null`, `is_not_null`

### Example: Aggregate Request

```json
{
  "metrics": [
    { "field": "capacity", "type": "sum", "alias": "totalCapacity" },
    { "field": "pricePerHour", "type": "avg", "alias": "avgPrice" }
  ],
  "buckets": [{ "field": "building" }],
  "filters": [{ "field": "status", "operator": "equals", "value": "available" }]
}
```

## Tests

- **178 E2E tests** passing
- **Unit tests** for aggregators, filters, transformers, schema analyzer

```bash
yarn test           # Unit tests
yarn test:e2e       # E2E tests
yarn test:cov       # Coverage
```

## Docker E2E Environment

Start the full E2E environment with MongoDB, Redis, Elasticsearch, and mock API:

```bash
yarn docker:e2e:up   # Start services
yarn test:e2e        # Run E2E tests
yarn docker:e2e:down # Stop and cleanup
```

See [E2E_TESTING.md](./E2E_TESTING.md) for detailed setup instructions.

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
