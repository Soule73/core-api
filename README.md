# DataVise Core API

NestJS-based REST API for DataVise platform - Microservices architecture for CRUD operations.

## Overview

Core API is the main service handling all CRUD operations for DataVise, including user management, dashboards, widgets, data sources, and AI conversations. Built with NestJS, MongoDB, and following SOLID principles.

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Testing**: Vitest (unit & E2E)
- **Compilation**: SWC (ultra-fast)

## Getting Started

### Prerequisites

- Node.js >= 20.x
- MongoDB >= 7.0
- Yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Configure your .env file
# Edit MONGODB_URI, JWT_SECRET, etc.
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/datavise

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=7d

# Server
PORT=3002
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Processing API
PROCESSING_API_URL=http://localhost:3001

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Running the Application

```bash
# Development mode (watch)
yarn start:dev

# Production mode
yarn build
yarn start:prod

# Debug mode
yarn start:debug
```

The API will be available at `http://localhost:3002/api/v1`

## Project Structure

```
src/
├── common/                 # Shared utilities
│   ├── decorators/        # Custom decorators (@CurrentUser, @Public, etc.)
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   ├── interceptors/      # Response transformation
│   └── interfaces/        # Common interfaces
├── config/                # Configuration files
│   ├── database.config.ts
│   └── jwt.config.ts
├── modules/               # Feature modules
│   ├── auth/             # Authentication & JWT
│   ├── users/            # User management
│   ├── dashboards/       # Dashboard CRUD
│   ├── widgets/          # Widget CRUD
│   ├── datasources/      # Data source metadata
│   └── ai-conversations/ # AI conversation CRUD
├── app.module.ts         # Root module
└── main.ts               # Application entry point
```

## API Endpoints

Base URL: `/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile

### Users
- `GET /users` - List all users (admin)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Dashboards
- `POST /dashboards` - Create dashboard
- `GET /dashboards` - List user dashboards
- `GET /dashboards/:id` - Get dashboard details
- `PATCH /dashboards/:id` - Update dashboard
- `DELETE /dashboards/:id` - Delete dashboard
- `PATCH /dashboards/:id/layout` - Update layout

### Widgets
- `POST /widgets` - Create widget
- `GET /widgets` - List widgets
- `GET /widgets/:id` - Get widget details
- `PATCH /widgets/:id` - Update widget
- `DELETE /widgets/:id` - Delete widget

### Data Sources
- `POST /datasources` - Create data source
- `GET /datasources` - List data sources
- `GET /datasources/:id` - Get data source details
- `POST /datasources/test` - Test connection
- `PATCH /datasources/:id` - Update data source
- `DELETE /datasources/:id` - Delete data source

### AI Conversations
- `POST /ai/conversations` - Create conversation
- `GET /ai/conversations` - List conversations
- `GET /ai/conversations/:id` - Get conversation details
- `PATCH /ai/conversations/:id` - Update conversation
- `DELETE /ai/conversations/:id` - Delete conversation

## Testing

### Unit Tests

```bash
# Run all unit tests
yarn test

# Watch mode
yarn test:watch

# With UI interface
yarn test:ui

# With coverage
yarn test:cov
```

### E2E Tests

```bash
# Run E2E tests
yarn test:e2e

# Watch mode
yarn test:e2e:watch
```

### Test Structure

```
src/
└── **/*.spec.ts          # Unit tests (next to source files)

test/
├── **/*.e2e-spec.ts      # E2E tests
├── setup.ts              # Global test configuration
└── helpers/
    ├── app.helper.ts     # App creation helper
    ├── database.helper.ts # Database utilities
    └── auth.helper.ts    # Authentication utilities
```

## Architecture Principles

This project follows:

- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself
- **Clean Architecture**: Separation of concerns in layers
- **Repository Pattern**: Data access abstraction
- **Dependency Injection**: NestJS built-in DI container

## Available Decorators

### Authentication
- `@Public()` - Mark route as public (no auth required)
- `@CurrentUser()` - Get authenticated user from request
- `@RequirePermissions(...permissions)` - Check user permissions

### Example Usage

```typescript
@Controller('users')
export class UsersController {
  @Get()
  @RequirePermissions('user:read')
  async findAll(@CurrentUser() user: User) {
    // user is automatically extracted from JWT
    return this.usersService.findAll();
  }

  @Get('public')
  @Public()
  async getPublicData() {
    // No authentication required
    return { message: 'Public data' };
  }
}
```

## Code Quality

### Linting

```bash
# Run ESLint
yarn lint

# Fix auto-fixable issues
yarn lint --fix
```

### Formatting

```bash
# Format code with Prettier
yarn format
```

## Docker

### Build Image

```bash
docker build -t datavise-core-api .
```

### Run Container

```bash
docker run -p 3002:3002 --env-file .env datavise-core-api
```

### Docker Compose

See [docker-compose.yml](../docker-compose.yml) in the root directory for full orchestration with MongoDB and Processing API.

## Development Workflow

### Creating a New Module

```bash
# Generate module, service, and controller
nest g module modules/resource-name
nest g service modules/resource-name
nest g controller modules/resource-name
```

### Adding a New Entity

1. Create schema in `modules/{module}/entities/{entity}.schema.ts`
2. Create DTOs in `modules/{module}/dto/`
3. Create repository in `modules/{module}/repositories/`
4. Implement service logic
5. Add controller routes
6. Write tests

## Performance

- **Hot Reload**: Automatic restart in development
- **SWC Compilation**: Ultra-fast TypeScript compilation
- **Test Performance**: Vitest is ~60% faster than Jest
- **MongoDB Indexes**: Configured on frequently queried fields

## Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Automatic DTO validation
- **CORS**: Configured for specific origins
- **Rate Limiting**: Coming soon
- **Helmet**: Security headers (planned)

## Monitoring

- **Health Check**: `GET /api/v1` returns "Hello World!"
- **Logs**: Console logging (production logging coming)
- **Error Tracking**: Global exception filter

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow NestJS conventions
- Document complex logic with JSDoc
- Write self-explanatory code (avoid inline comments)
- Add unit tests for services
- Add E2E tests for endpoints

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add JWT refresh token
fix(users): resolve email validation bug
docs(readme): update installation steps
test(widgets): add unit tests for widget service
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongo --eval "db.version()"

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/datavise
```

### Port Already in Use

```bash
# Find process using port 3002
netstat -ano | findstr :3002

# Kill the process (Windows)
taskkill /PID <PID> /F
```

### Tests Failing

```bash
# Clear node_modules and reinstall
rm -rf node_modules
yarn install

# Clear Vitest cache
rm -rf node_modules/.vitest
```

## Roadmap

- [ ] Implement remaining modules (Auth, Users, etc.)
- [ ] Add Redis caching layer
- [ ] Implement rate limiting
- [ ] Add Swagger/OpenAPI documentation
- [ ] Add health check endpoints
- [ ] Implement structured logging
- [ ] Add metrics collection
- [ ] CI/CD pipeline setup
- [ ] Production deployment guide

## Performance Benchmarks

- Startup time: ~2s
- Average response time: <50ms
- Test execution: ~4s (6 tests)
- Memory usage: ~100MB

## License

UNLICENSED - Private project

## Support

For questions or issues:
1. Check documentation in `docs/` folder
2. Review existing tests for examples
3. Consult NestJS documentation: https://docs.nestjs.com/

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history (coming soon).

---

**Built with NestJS** - A progressive Node.js framework
