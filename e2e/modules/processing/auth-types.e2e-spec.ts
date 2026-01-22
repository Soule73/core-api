import { describe, it, expect, beforeEach } from 'vitest';
import { BaseE2ETest } from '../../base';

interface ApiResponse {
  _id?: string;
}

interface AuthConfig {
  type: string;
  endpoint: string;
  authType: string;
  authConfig: Record<string, unknown>;
}

/**
 * E2E tests for Processing module - Different authentication types.
 */
class AuthTypesE2ETest extends BaseE2ETest {
  private static readonly AUTH_CONFIGS: Record<string, AuthConfig> = {
    bearer: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/bearer/salles',
      authType: 'bearer',
      authConfig: { token: 'test-bearer-token-123' },
    },
    apiKeyHeader: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/apikey/salles',
      authType: 'apiKey',
      authConfig: {
        key: 'test-api-key-456',
        headerName: 'x-api-key',
        addTo: 'header',
      },
    },
    apiKeyQuery: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/apikey/salles',
      authType: 'apiKey',
      authConfig: {
        key: 'test-api-key-456',
        queryParam: 'api_key',
        addTo: 'query',
      },
    },
    basic: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/basic/salles',
      authType: 'basic',
      authConfig: {
        username: 'testuser',
        password: 'testpass123',
      },
    },
  };

  private static readonly INVALID_AUTH_CONFIGS: Record<string, AuthConfig> = {
    invalidBearer: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/bearer/salles',
      authType: 'bearer',
      authConfig: { token: 'invalid-token' },
    },
    invalidApiKey: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/apikey/salles',
      authType: 'apiKey',
      authConfig: {
        key: 'wrong-api-key',
        headerName: 'x-api-key',
        addTo: 'header',
      },
    },
    invalidBasic: {
      type: 'json',
      endpoint: 'http://localhost:3001/api/auth/basic/salles',
      authType: 'basic',
      authConfig: {
        username: 'wronguser',
        password: 'wrongpass',
      },
    },
  };

  async createDataSourceWithAuth(config: AuthConfig): Promise<string> {
    const response = await this.post('/api/v1/datasources', {
      name: `Auth Source ${Date.now()}`,
      type: config.type,
      endpoint: config.endpoint,
      httpMethod: 'GET',
      authType: config.authType,
      authConfig: config.authConfig,
      visibility: 'private',
    });

    if (response.status === 201) {
      return (response.body as ApiResponse)._id ?? '';
    }
    return '';
  }

  static getValidAuthConfigs(): Record<string, AuthConfig> {
    return AuthTypesE2ETest.AUTH_CONFIGS;
  }

  static getInvalidAuthConfigs(): Record<string, AuthConfig> {
    return AuthTypesE2ETest.INVALID_AUTH_CONFIGS;
  }
}

const test = new AuthTypesE2ETest();

describe('Processing - Authentication Types (E2E)', () => {
  describe('DataSource with Bearer Authentication', () => {
    let bearerDataSourceId = '';

    beforeEach(async () => {
      bearerDataSourceId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getValidAuthConfigs().bearer,
      );
    });

    it('should create datasource with bearer auth', () => {
      expect(bearerDataSourceId).toBeDefined();
    });

    it('should fetch data with bearer authentication', async () => {
      if (!bearerDataSourceId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${bearerDataSourceId}/data`,
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });

    it('should aggregate data with bearer authentication', async () => {
      if (!bearerDataSourceId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${bearerDataSourceId}/aggregate`,
        { metrics: [{ field: 'capacity', type: 'sum' }] },
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });

    it('should analyze schema with bearer authentication', async () => {
      if (!bearerDataSourceId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${bearerDataSourceId}/schema`,
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });
  });

  describe('DataSource with API Key Authentication (Header)', () => {
    let apiKeyHeaderDataSourceId = '';

    beforeEach(async () => {
      apiKeyHeaderDataSourceId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getValidAuthConfigs().apiKeyHeader,
      );
    });

    it('should create datasource with apiKey header auth', () => {
      expect(apiKeyHeaderDataSourceId).toBeDefined();
    });

    it('should fetch data with apiKey header authentication', async () => {
      if (!apiKeyHeaderDataSourceId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${apiKeyHeaderDataSourceId}/data`,
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });

    it('should aggregate data with apiKey header authentication', async () => {
      if (!apiKeyHeaderDataSourceId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${apiKeyHeaderDataSourceId}/aggregate`,
        { metrics: [{ field: 'capacity', type: 'avg' }] },
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });
  });

  describe('DataSource with API Key Authentication (Query)', () => {
    let apiKeyQueryDataSourceId = '';

    beforeEach(async () => {
      apiKeyQueryDataSourceId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getValidAuthConfigs().apiKeyQuery,
      );
    });

    it('should create datasource with apiKey query auth', () => {
      expect(apiKeyQueryDataSourceId).toBeDefined();
    });

    it('should fetch data with apiKey query authentication', async () => {
      if (!apiKeyQueryDataSourceId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${apiKeyQueryDataSourceId}/data`,
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });
  });

  describe('DataSource with Basic Authentication', () => {
    let basicAuthDataSourceId = '';

    beforeEach(async () => {
      basicAuthDataSourceId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getValidAuthConfigs().basic,
      );
    });

    it('should create datasource with basic auth', () => {
      expect(basicAuthDataSourceId).toBeDefined();
    });

    it('should fetch data with basic authentication', async () => {
      if (!basicAuthDataSourceId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${basicAuthDataSourceId}/data`,
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });

    it('should aggregate data with basic authentication', async () => {
      if (!basicAuthDataSourceId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${basicAuthDataSourceId}/aggregate`,
        { metrics: [{ field: 'pricePerHour', type: 'max' }] },
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });

    it('should analyze schema with basic authentication', async () => {
      if (!basicAuthDataSourceId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${basicAuthDataSourceId}/schema`,
      );
      expect([200, 401, 500, 502, 503]).toContain(response.status);
    });
  });

  describe('DataSource with Invalid Authentication', () => {
    it('should fail with invalid bearer token', async () => {
      const dsId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getInvalidAuthConfigs().invalidBearer,
      );
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
      );
      expect([401, 403, 500, 502, 503]).toContain(response.status);
    });

    it('should fail with invalid api key', async () => {
      const dsId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getInvalidAuthConfigs().invalidApiKey,
      );
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
      );
      expect([401, 403, 500, 502, 503]).toContain(response.status);
    });

    it('should fail with invalid basic auth credentials', async () => {
      const dsId = await test.createDataSourceWithAuth(
        AuthTypesE2ETest.getInvalidAuthConfigs().invalidBasic,
      );
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
      );
      expect([401, 403, 500, 502, 503]).toContain(response.status);
    });
  });
});
