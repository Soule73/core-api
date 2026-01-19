# Contributing to Core API

## Development Setup

```bash
git clone https://github.com/Soule73/core-api.git
cd core-api
yarn install
cp .env.example .env
yarn start:dev
```

## Branch Naming

```
feat/feature-name
fix/bug-description
docs/documentation-update
refactor/refactoring-description
test/test-description
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>
```

### Types

| Type       | Description                      |
| ---------- | -------------------------------- |
| `feat`     | New feature                      |
| `fix`      | Bug fix                          |
| `docs`     | Documentation                    |
| `style`    | Code style (formatting)          |
| `refactor` | Code refactoring                 |
| `perf`     | Performance improvement          |
| `test`     | Adding/updating tests            |
| `chore`    | Build process or auxiliary tools |
| `ci`       | CI configuration                 |
| `build`    | Build system changes             |
| `revert`   | Revert a commit                  |

### Scopes

`auth`, `users`, `roles`, `dashboards`, `widgets`, `datasources`, `ai`, `config`, `common`, `tests`, `docs`

### Examples

```bash
feat(auth): add JWT refresh token
fix(users): resolve email validation bug
docs(readme): update installation steps
test(widgets): add unit tests for widget service
refactor(dashboards): simplify layout update logic
```

### Using Commitizen

```bash
yarn commit
```

## Code Style

- TypeScript strict mode
- No inline comments
- Self-explanatory code
- JSDoc for functions and classes
- SOLID and DRY principles

## Testing

### Before Submitting

```bash
yarn lint
yarn format
yarn test
yarn test:e2e
```

### Test Coverage

- Unit tests: `src/**/*.spec.ts`
- E2E tests: `test/**/*.e2e-spec.ts`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run all tests
4. Commit with conventional commit message
5. Push and create PR
6. Wait for review

## Release Process

```bash
yarn release          # Auto version bump
yarn release:patch    # Patch version (1.0.x)
yarn release:minor    # Minor version (1.x.0)
yarn release:major    # Major version (x.0.0)
```

## Project Structure

```
src/
├── common/           # Shared utilities
├── config/           # Configuration
├── database/         # Database module
└── modules/          # Feature modules
    └── {module}/
        ├── dto/
        ├── interfaces/
        ├── schemas/
        ├── {module}.controller.ts
        ├── {module}.service.ts
        ├── {module}.service.spec.ts
        └── {module}.module.ts
```

## Questions

Open an issue for questions or discussions.
