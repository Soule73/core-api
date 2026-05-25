import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataFetcherService } from './data-fetcher.service';
import { DataSource } from '../../datasources/schemas/datasource.schema';
import { ConnectorFactory } from '../connectors';
import { EncryptionService } from '../../../common/services/encryption.service';
import { describe, vi, beforeEach, afterEach, it, expect } from 'vitest';

describe('DataFetcherService', () => {
  let service: DataFetcherService;
  let module: TestingModule;

  const mockDataSourceModel = {
    findById: vi.fn(),
  };

  const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockConnectorFactory = {
    getConnector: vi.fn(),
  };

  const mockEncryptionService = {
    encrypt: vi.fn((v: string) => `enc:${v}`),
    decrypt: vi.fn((v: string) => v.replace('enc:', '')),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DataFetcherService,
        {
          provide: getModelToken(DataSource.name),
          useValue: mockDataSourceModel,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConnectorFactory,
          useValue: mockConnectorFactory,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<DataFetcherService>(DataFetcherService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectColumns', () => {
    it('should detect id field as string not datetime', async () => {
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'salle-001',
              name: 'Salle Einstein',
              capacity: 50,
              lastBooking: '2026-01-15T14:00:00Z',
            },
            {
              id: 'salle-002',
              name: 'Salle Curie',
              capacity: 30,
              lastBooking: '2026-01-20T09:00:00Z',
            },
          ],
          total: 2,
        }),
      };

      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      const result = await service.detectColumns({
        type: 'json',
        endpoint: 'http://example.com/api',
      });

      expect(result.types.id).toBe('string');
      expect(result.types.name).toBe('string');
      expect(result.types.capacity).toBe('integer');
      expect(result.types.lastBooking).toBe('datetime');
    });

    it('should detect various ID patterns as string', async () => {
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({
          data: [
            { id: 'user-001', code: 'ABC-123', ref: 'REF_2024_001' },
            { id: 'user-002', code: 'DEF-456', ref: 'REF_2024_002' },
          ],
          total: 2,
        }),
      };

      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      const result = await service.detectColumns({
        type: 'json',
        endpoint: 'http://example.com/api',
      });

      expect(result.types.id).toBe('string');
      expect(result.types.code).toBe('string');
      expect(result.types.ref).toBe('string');
    });

    it('should detect ISO date formats correctly', async () => {
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({
          data: [
            {
              date: '2026-01-15',
              datetime: '2026-01-15T14:00:00Z',
              datetimeOffset: '2026-01-15T14:00:00+02:00',
            },
            {
              date: '2026-01-20',
              datetime: '2026-01-20T09:00:00Z',
              datetimeOffset: '2026-01-20T09:00:00+02:00',
            },
          ],
          total: 2,
        }),
      };

      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      const result = await service.detectColumns({
        type: 'json',
        endpoint: 'http://example.com/api',
      });

      expect(result.types.date).toBe('date');
      expect(result.types.datetime).toBe('datetime');
      expect(result.types.datetimeOffset).toBe('datetime');
    });

    it('should detect boolean fields correctly', async () => {
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({
          data: [
            { active: true, enabled: 'true' },
            { active: false, enabled: 'false' },
          ],
          total: 2,
        }),
      };

      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      const result = await service.detectColumns({
        type: 'json',
        endpoint: 'http://example.com/api',
      });

      expect(result.types.active).toBe('boolean');
      expect(result.types.enabled).toBe('boolean');
    });

    it('should detect numeric fields correctly', async () => {
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({
          data: [
            { count: 10, price: 19.99, rating: 4.5 },
            { count: 20, price: 29.99, rating: 3.8 },
          ],
          total: 2,
        }),
      };

      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      const result = await service.detectColumns({
        type: 'json',
        endpoint: 'http://example.com/api',
      });

      expect(result.types.count).toBe('integer');
      expect(result.types.price).toBe('number');
      expect(result.types.rating).toBe('number');
    });
  });

  describe('fetchData — authConfig decryption', () => {
    const BASE_64_SEGMENT = '[A-Za-z0-9+/]+=*';
    const CIPHERTEXT_PATTERN = new RegExp(
      `^${BASE_64_SEGMENT}:${BASE_64_SEGMENT}:${BASE_64_SEGMENT}$`,
    );

    it('should decrypt encrypted bearer token before passing config to connector', async () => {
      const encryptedToken = 'aXY=:dGFn:Y2lwaGVy'; // fake ciphertext format iv:tag:cipher
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      };
      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      mockEncryptionService.decrypt.mockReturnValueOnce('plain-token');

      mockDataSourceModel.findById.mockReturnValue({
        lean: () => ({
          exec: () =>
            Promise.resolve({
              _id: 'ds-1',
              type: 'json',
              endpoint: 'http://example.com/api',
              authType: 'bearer',
              authConfig: { token: encryptedToken },
            }),
        }),
      });

      await service.fetchData({ dataSourceId: 'ds-1' });

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(encryptedToken);
      const passedConfig = mockConnector.fetchData.mock.calls[0][0];
      expect(passedConfig.authConfig.token).toBe('plain-token');
    });

    it('should pass plaintext (non-encrypted) values through unchanged', async () => {
      const plaintextPassword = 'my-plain-password';
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      };
      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      mockEncryptionService.decrypt.mockClear();

      mockDataSourceModel.findById.mockReturnValue({
        lean: () => ({
          exec: () =>
            Promise.resolve({
              _id: 'ds-2',
              type: 'json',
              endpoint: 'http://example.com/api',
              authType: 'basic',
              authConfig: { password: plaintextPassword },
            }),
        }),
      });

      await service.fetchData({ dataSourceId: 'ds-2' });

      // Non-ciphertext values must not be passed to decrypt
      expect(mockEncryptionService.decrypt).not.toHaveBeenCalled();
      const passedConfig = mockConnector.fetchData.mock.calls[0][0];
      expect(passedConfig.authConfig.password).toBe(plaintextPassword);
    });

    it('should not attempt to decrypt fields for auth type with no encrypted fields', async () => {
      const mockConnector = {
        fetchData: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      };
      mockConnectorFactory.getConnector.mockReturnValue(mockConnector);

      mockEncryptionService.decrypt.mockClear();

      mockDataSourceModel.findById.mockReturnValue({
        lean: () => ({
          exec: () =>
            Promise.resolve({
              _id: 'ds-3',
              type: 'json',
              endpoint: 'http://example.com/api',
              authType: 'none',
              authConfig: {},
            }),
        }),
      });

      await service.fetchData({ dataSourceId: 'ds-3' });

      expect(mockEncryptionService.decrypt).not.toHaveBeenCalled();
    });

    it('pattern check: CIPHERTEXT_PATTERN only matches iv:tag:cipher format', () => {
      expect(CIPHERTEXT_PATTERN.test('aXY=:dGFn:Y2lwaGVy')).toBe(true);
      expect(CIPHERTEXT_PATTERN.test('plaintext')).toBe(false);
      expect(CIPHERTEXT_PATTERN.test('Bearer my-token')).toBe(false);
      expect(CIPHERTEXT_PATTERN.test('')).toBe(false);
    });
  });
});
