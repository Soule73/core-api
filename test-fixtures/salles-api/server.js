const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const sallesData = [
  {
    id: 'salle-001',
    name: 'Salle Einstein',
    capacity: 50,
    building: 'A',
    floor: 1,
    hasProjector: true,
    hasVideoConference: true,
    pricePerHour: 75.0,
    status: 'available',
    lastBooking: '2026-01-15T14:00:00Z',
    rating: 4.5,
  },
  {
    id: 'salle-002',
    name: 'Salle Curie',
    capacity: 30,
    building: 'A',
    floor: 2,
    hasProjector: true,
    hasVideoConference: false,
    pricePerHour: 50.0,
    status: 'occupied',
    lastBooking: '2026-01-20T09:00:00Z',
    rating: 4.2,
  },
  {
    id: 'salle-003',
    name: 'Salle Newton',
    capacity: 100,
    building: 'B',
    floor: 0,
    hasProjector: true,
    hasVideoConference: true,
    pricePerHour: 120.0,
    status: 'available',
    lastBooking: '2026-01-18T16:00:00Z',
    rating: 4.8,
  },
  {
    id: 'salle-004',
    name: 'Salle Darwin',
    capacity: 20,
    building: 'B',
    floor: 1,
    hasProjector: false,
    hasVideoConference: false,
    pricePerHour: 30.0,
    status: 'maintenance',
    lastBooking: '2026-01-10T11:00:00Z',
    rating: 3.5,
  },
  {
    id: 'salle-005',
    name: 'Salle Pasteur',
    capacity: 40,
    building: 'A',
    floor: 3,
    hasProjector: true,
    hasVideoConference: true,
    pricePerHour: 65.0,
    status: 'available',
    lastBooking: '2026-01-21T10:00:00Z',
    rating: 4.6,
  },
  {
    id: 'salle-006',
    name: 'Salle Lavoisier',
    capacity: 25,
    building: 'C',
    floor: 1,
    hasProjector: true,
    hasVideoConference: false,
    pricePerHour: 45.0,
    status: 'available',
    lastBooking: '2026-01-19T13:00:00Z',
    rating: 4.0,
  },
  {
    id: 'salle-007',
    name: 'Salle Tesla',
    capacity: 80,
    building: 'B',
    floor: 2,
    hasProjector: true,
    hasVideoConference: true,
    pricePerHour: 100.0,
    status: 'occupied',
    lastBooking: '2026-01-21T08:00:00Z',
    rating: 4.7,
  },
  {
    id: 'salle-008',
    name: 'Salle Galileo',
    capacity: 15,
    building: 'C',
    floor: 0,
    hasProjector: false,
    hasVideoConference: false,
    pricePerHour: 25.0,
    status: 'available',
    lastBooking: '2026-01-14T15:00:00Z',
    rating: 3.8,
  },
  {
    id: 'salle-009',
    name: 'Salle Planck',
    capacity: 60,
    building: 'A',
    floor: 4,
    hasProjector: true,
    hasVideoConference: true,
    pricePerHour: 85.0,
    status: 'available',
    lastBooking: '2026-01-20T14:00:00Z',
    rating: 4.4,
  },
  {
    id: 'salle-010',
    name: 'Salle Fermi',
    capacity: 35,
    building: 'C',
    floor: 2,
    hasProjector: true,
    hasVideoConference: true,
    pricePerHour: 55.0,
    status: 'occupied',
    lastBooking: '2026-01-21T11:00:00Z',
    rating: 4.1,
  },
];

const reservationsData = [
  {
    id: 'res-001',
    salleId: 'salle-001',
    userId: 'user-001',
    startTime: '2026-01-22T09:00:00Z',
    endTime: '2026-01-22T11:00:00Z',
    status: 'confirmed',
    attendees: 25,
    purpose: 'Team Meeting',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'res-002',
    salleId: 'salle-003',
    userId: 'user-002',
    startTime: '2026-01-22T14:00:00Z',
    endTime: '2026-01-22T17:00:00Z',
    status: 'confirmed',
    attendees: 80,
    purpose: 'Company Presentation',
    createdAt: '2026-01-16T14:30:00Z',
  },
  {
    id: 'res-003',
    salleId: 'salle-002',
    userId: 'user-001',
    startTime: '2026-01-23T10:00:00Z',
    endTime: '2026-01-23T12:00:00Z',
    status: 'pending',
    attendees: 15,
    purpose: 'Client Call',
    createdAt: '2026-01-18T09:00:00Z',
  },
  {
    id: 'res-004',
    salleId: 'salle-005',
    userId: 'user-003',
    startTime: '2026-01-24T08:00:00Z',
    endTime: '2026-01-24T10:00:00Z',
    status: 'confirmed',
    attendees: 30,
    purpose: 'Training Session',
    createdAt: '2026-01-19T11:00:00Z',
  },
  {
    id: 'res-005',
    salleId: 'salle-007',
    userId: 'user-002',
    startTime: '2026-01-25T13:00:00Z',
    endTime: '2026-01-25T16:00:00Z',
    status: 'cancelled',
    attendees: 50,
    purpose: 'Workshop',
    createdAt: '2026-01-17T16:00:00Z',
  },
];

function parseQueryParams(url) {
  const queryString = url.split('?')[1] || '';
  const params = {};
  queryString.split('&').forEach((param) => {
    const [key, value] = param.split('=');
    if (key) params[key] = decodeURIComponent(value || '');
  });
  return params;
}

function filterData(data, params) {
  let result = [...data];

  Object.keys(params).forEach((key) => {
    if (key === 'page' || key === 'pageSize') return;
    const value = params[key];
    result = result.filter((item) => {
      if (item[key] === undefined) return true;
      return String(item[key]).toLowerCase().includes(value.toLowerCase());
    });
  });

  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 100;
  const start = (page - 1) * pageSize;

  return {
    data: result.slice(start, start + pageSize),
    total: result.length,
    page,
    pageSize,
  };
}

const AUTH_CONFIG = {
  bearer: {
    validTokens: ['test-bearer-token-123', 'valid-jwt-token-abc'],
  },
  apiKey: {
    header: 'x-api-key',
    queryParam: 'api_key',
    validKeys: ['test-api-key-456', 'valid-api-key-xyz'],
  },
  basic: {
    users: {
      testuser: 'testpass123',
      admin: 'admin123',
    },
  },
};

function validateBearerAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Bearer token format' };
  }
  const token = authHeader.substring(7);
  if (!AUTH_CONFIG.bearer.validTokens.includes(token)) {
    return { valid: false, error: 'Invalid Bearer token' };
  }
  return { valid: true };
}

function validateApiKeyAuth(req, params) {
  const headerKey = req.headers[AUTH_CONFIG.apiKey.header];
  const queryKey = params[AUTH_CONFIG.apiKey.queryParam];
  const apiKey = headerKey || queryKey;

  if (!apiKey) {
    return { valid: false, error: 'Missing API key' };
  }
  if (!AUTH_CONFIG.apiKey.validKeys.includes(apiKey)) {
    return { valid: false, error: 'Invalid API key' };
  }
  return { valid: true };
}

function validateBasicAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Basic ')) {
    return { valid: false, error: 'Missing or invalid Basic auth format' };
  }
  const base64Credentials = authHeader.substring(6);
  let credentials;
  try {
    credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  } catch {
    return { valid: false, error: 'Invalid Base64 encoding' };
  }
  const [username, password] = credentials.split(':');
  if (!username || !password) {
    return { valid: false, error: 'Invalid credentials format' };
  }
  if (AUTH_CONFIG.basic.users[username] !== password) {
    return { valid: false, error: 'Invalid username or password' };
  }
  return { valid: true, username };
}

function sendUnauthorized(res, message) {
  res.writeHead(401);
  res.end(JSON.stringify({ error: 'Unauthorized', message }));
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];
  const params = parseQueryParams(req.url);

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  if (urlPath === '/health') {
    res.writeHead(200);
    res.end(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    );
    return;
  }

  if (urlPath === '/api/salles') {
    const result = filterData(sallesData, params);
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/reservations') {
    const result = filterData(reservationsData, params);
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/auth/bearer/salles') {
    const authResult = validateBearerAuth(req);
    if (!authResult.valid) {
      sendUnauthorized(res, authResult.error);
      return;
    }
    const result = filterData(sallesData, params);
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/auth/apikey/salles') {
    const authResult = validateApiKeyAuth(req, params);
    if (!authResult.valid) {
      sendUnauthorized(res, authResult.error);
      return;
    }
    const result = filterData(sallesData, params);
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/auth/basic/salles') {
    const authResult = validateBasicAuth(req);
    if (!authResult.valid) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Salles API"');
      sendUnauthorized(res, authResult.error);
      return;
    }
    const result = filterData(sallesData, params);
    result.authenticatedUser = authResult.username;
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/auth/bearer/reservations') {
    const authResult = validateBearerAuth(req);
    if (!authResult.valid) {
      sendUnauthorized(res, authResult.error);
      return;
    }
    const result = filterData(reservationsData, params);
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/auth/apikey/reservations') {
    const authResult = validateApiKeyAuth(req, params);
    if (!authResult.valid) {
      sendUnauthorized(res, authResult.error);
      return;
    }
    const result = filterData(reservationsData, params);
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath === '/api/auth/basic/reservations') {
    const authResult = validateBasicAuth(req);
    if (!authResult.valid) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Salles API"');
      sendUnauthorized(res, authResult.error);
      return;
    }
    const result = filterData(reservationsData, params);
    result.authenticatedUser = authResult.username;
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (urlPath.startsWith('/api/salles/')) {
    const id = urlPath.replace('/api/salles/', '');
    const salle = sallesData.find((s) => s.id === id);
    if (salle) {
      res.writeHead(200);
      res.end(JSON.stringify(salle));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Salle not found' }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Salles API Mock Server running on port ${PORT}`);
  console.log(`\nPublic Endpoints (no auth):`);
  console.log(`  GET /health`);
  console.log(`  GET /api/salles`);
  console.log(`  GET /api/salles/:id`);
  console.log(`  GET /api/reservations`);
  console.log(`\nBearer Auth Endpoints (token: test-bearer-token-123):`);
  console.log(`  GET /api/auth/bearer/salles`);
  console.log(`  GET /api/auth/bearer/reservations`);
  console.log(
    `\nAPI Key Endpoints (header: x-api-key or query: api_key, value: test-api-key-456):`,
  );
  console.log(`  GET /api/auth/apikey/salles`);
  console.log(`  GET /api/auth/apikey/reservations`);
  console.log(`\nBasic Auth Endpoints (user: testuser, pass: testpass123):`);
  console.log(`  GET /api/auth/basic/salles`);
  console.log(`  GET /api/auth/basic/reservations`);
});
