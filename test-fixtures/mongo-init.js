db = db.getSiblingDB('datavise_test');

db.createCollection('users');
db.createCollection('roles');
db.createCollection('permissions');
db.createCollection('datasources');
db.createCollection('dashboards');
db.createCollection('widgets');

db.permissions.insertMany([
  { name: 'dashboard:canCreate', description: 'Can create dashboards' },
  { name: 'dashboard:canRead', description: 'Can read dashboards' },
  { name: 'dashboard:canUpdate', description: 'Can update dashboards' },
  { name: 'dashboard:canDelete', description: 'Can delete dashboards' },
  { name: 'widget:canCreate', description: 'Can create widgets' },
  { name: 'widget:canRead', description: 'Can read widgets' },
  { name: 'widget:canUpdate', description: 'Can update widgets' },
  { name: 'widget:canDelete', description: 'Can delete widgets' },
  { name: 'datasource:canCreate', description: 'Can create data sources' },
  { name: 'datasource:canRead', description: 'Can read data sources' },
  { name: 'datasource:canUpdate', description: 'Can update data sources' },
  { name: 'datasource:canDelete', description: 'Can delete data sources' },
  { name: 'user:canManage', description: 'Can manage users' },
  { name: 'role:canManage', description: 'Can manage roles' },
]);

const permissions = db.permissions.find().toArray();
const permissionIds = permissions.map((p) => p._id);

db.roles.insertMany([
  {
    name: 'admin',
    description: 'Administrator with full access',
    permissions: permissionIds,
    isDefault: false,
  },
  {
    name: 'user',
    description: 'Regular user with basic access',
    permissions: permissionIds.slice(0, 12),
    isDefault: true,
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    permissions: permissionIds.filter((_, i) => [1, 5, 9].includes(i)),
    isDefault: false,
  },
]);

const adminRole = db.roles.findOne({ name: 'admin' });
const userRole = db.roles.findOne({ name: 'user' });

db.users.insertMany([
  {
    email: 'admin@datavise.test',
    password: '$2b$10$K4Zt4BvIw9NqOdL5q5vQJ.YQHxLl3qJh5cT7fE2KJKPHvB4v8g5Iq',
    firstName: 'Admin',
    lastName: 'User',
    roleId: adminRole._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    email: 'user@datavise.test',
    password: '$2b$10$K4Zt4BvIw9NqOdL5q5vQJ.YQHxLl3qJh5cT7fE2KJKPHvB4v8g5Iq',
    firstName: 'Test',
    lastName: 'User',
    roleId: userRole._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const adminUser = db.users.findOne({ email: 'admin@datavise.test' });

db.datasources.insertMany([
  {
    name: 'Salles API (JSON)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/salles',
    httpMethod: 'GET',
    authType: 'none',
    authConfig: {},
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Reservations API (JSON)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/reservations',
    httpMethod: 'GET',
    authType: 'none',
    authConfig: {},
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'createdAt',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salles CSV',
    type: 'csv',
    filePath: '/app/test-fixtures/salles-data.csv',
    authType: 'none',
    authConfig: {},
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salles Elasticsearch',
    type: 'elasticsearch',
    endpoint: 'http://elasticsearch:9200',
    esIndex: 'salles-index',
    esQuery: { match_all: {} },
    authType: 'none',
    authConfig: {},
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salles API (Bearer Auth)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/auth/bearer/salles',
    httpMethod: 'GET',
    authType: 'bearer',
    authConfig: {
      token: 'test-bearer-token-123',
    },
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Reservations API (Bearer Auth)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/auth/bearer/reservations',
    httpMethod: 'GET',
    authType: 'bearer',
    authConfig: {
      token: 'test-bearer-token-123',
    },
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'createdAt',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salles API (API Key Header)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/auth/apikey/salles',
    httpMethod: 'GET',
    authType: 'apiKey',
    authConfig: {
      key: 'test-api-key-456',
      headerName: 'x-api-key',
      addTo: 'header',
    },
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salles API (API Key Query)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/auth/apikey/salles',
    httpMethod: 'GET',
    authType: 'apiKey',
    authConfig: {
      key: 'test-api-key-456',
      queryParam: 'api_key',
      addTo: 'query',
    },
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salles API (Basic Auth)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/auth/basic/salles',
    httpMethod: 'GET',
    authType: 'basic',
    authConfig: {
      username: 'testuser',
      password: 'testpass123',
    },
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'lastBooking',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Reservations API (Basic Auth)',
    type: 'json',
    endpoint: 'http://salles-api:3001/api/auth/basic/reservations',
    httpMethod: 'GET',
    authType: 'basic',
    authConfig: {
      username: 'testuser',
      password: 'testpass123',
    },
    config: {},
    ownerId: adminUser._id,
    visibility: 'public',
    timestampField: 'createdAt',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print('MongoDB initialization complete!');
print('Users created:');
print('  - admin@datavise.test (password: password123)');
print('  - user@datavise.test (password: password123)');
print('DataSources created:');
print(
  '  - No Auth: Salles API, Reservations API, Salles CSV, Salles Elasticsearch',
);
print('  - Bearer Auth: Salles API, Reservations API');
print('  - API Key (header): Salles API');
print('  - API Key (query): Salles API');
print('  - Basic Auth: Salles API, Reservations API');
print('Total: 10 datasources');
