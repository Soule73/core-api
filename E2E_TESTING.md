# E2E Test Environment for Core-API

This directory contains fixtures and configuration for running end-to-end tests.

## Quick Start

```bash
# Start all services
docker compose -f docker-compose.e2e.yml up -d

# Wait for initialization (ES init takes ~30s)
docker compose -f docker-compose.e2e.yml logs -f es-init

# Run e2e tests
npm run test:e2e

# Stop all services
docker compose -f docker-compose.e2e.yml down -v
```

## Services

| Service       | Port  | Description          |
| ------------- | ----- | -------------------- |
| core-api      | 3000  | Main API under test  |
| mongo         | 27018 | MongoDB database     |
| redis         | 6380  | Redis cache          |
| elasticsearch | 9201  | Elasticsearch        |
| salles-api    | 3001  | Mock JSON API server |

## Test Data

### DataSources (pre-created in MongoDB)

#### No Authentication

1. **Salles API (JSON)** - `http://salles-api:3001/api/salles`
2. **Reservations API (JSON)** - `http://salles-api:3001/api/reservations`
3. **Salles CSV** - `/app/test-fixtures/salles-data.csv`
4. **Salles Elasticsearch** - Index `salles-index`

#### Bearer Token Authentication

5. **Salles API (Bearer Auth)** - `http://salles-api:3001/api/auth/bearer/salles`
6. **Reservations API (Bearer Auth)** - `http://salles-api:3001/api/auth/bearer/reservations`

#### API Key Authentication

7. **Salles API (API Key Header)** - `http://salles-api:3001/api/auth/apikey/salles`
8. **Salles API (API Key Query)** - Same endpoint with `?api_key=...`

#### Basic Authentication

9. **Salles API (Basic Auth)** - `http://salles-api:3001/api/auth/basic/salles`
10. **Reservations API (Basic Auth)** - `http://salles-api:3001/api/auth/basic/reservations`

### Authentication Credentials

| Auth Type | Credential                           |
| --------- | ------------------------------------ |
| Bearer    | Token: `test-bearer-token-123`       |
| API Key   | Key: `test-api-key-456`              |
| Basic     | User: `testuser` Pass: `testpass123` |

### Test Users

| Email               | Password    | Role  |
| ------------------- | ----------- | ----- |
| admin@datavise.test | password123 | admin |
| user@datavise.test  | password123 | user  |

### Salles Data Schema

```typescript
interface Salle {
  id: string;
  name: string;
  capacity: number;
  building: 'A' | 'B' | 'C';
  floor: number;
  hasProjector: boolean;
  hasVideoConference: boolean;
  pricePerHour: number;
  status: 'available' | 'occupied' | 'maintenance';
  lastBooking: string; // ISO date
  rating: number;
  tags?: string[];
}
```

## Files

- `docker-compose.e2e.yml` - Docker Compose configuration
- `test-fixtures/`
  - `mongo-init.js` - MongoDB initialization script
  - `es-init.sh` - Elasticsearch index creation
  - `salles-data.csv` - CSV test data
  - `salles-data.json` - JSON test data
  - `salles-api/` - Mock API server

## Troubleshooting

### Elasticsearch not starting

```bash
# Check ES logs
docker compose -f docker-compose.e2e.yml logs elasticsearch

# Increase memory if needed (on Linux)
sudo sysctl -w vm.max_map_count=262144
```

### Reset all data

```bash
docker compose -f docker-compose.e2e.yml down -v
docker compose -f docker-compose.e2e.yml up -d
```
