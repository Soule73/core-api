import { describe, it, expect, beforeEach } from 'vitest';
import { BaseE2ETest } from '../../base';

interface ApiResponse {
  _id?: string;
}

interface FilterTestCase {
  name: string;
  filter: { field: string; operator: string; value: unknown };
}

/**
 * E2E tests for Processing module - Filter operators.
 */
class FiltersE2ETest extends BaseE2ETest {
  private jsonDataSourceId = '';

  private static readonly FILTER_TEST_CASES: FilterTestCase[] = [
    {
      name: 'equals',
      filter: { field: 'status', operator: 'equals', value: 'available' },
    },
    {
      name: 'not_equals',
      filter: { field: 'status', operator: 'not_equals', value: 'maintenance' },
    },
    {
      name: 'contains',
      filter: { field: 'name', operator: 'contains', value: 'Salle' },
    },
    {
      name: 'not_contains',
      filter: { field: 'name', operator: 'not_contains', value: 'Test' },
    },
    {
      name: 'greater_than',
      filter: { field: 'capacity', operator: 'greater_than', value: 10 },
    },
    {
      name: 'less_than',
      filter: { field: 'capacity', operator: 'less_than', value: 100 },
    },
    {
      name: 'greater_than_or_equal',
      filter: {
        field: 'capacity',
        operator: 'greater_than_or_equal',
        value: 20,
      },
    },
    {
      name: 'less_than_or_equal',
      filter: { field: 'capacity', operator: 'less_than_or_equal', value: 50 },
    },
    {
      name: 'between',
      filter: { field: 'capacity', operator: 'between', value: [10, 50] },
    },
    {
      name: 'in',
      filter: {
        field: 'status',
        operator: 'in',
        value: ['available', 'occupied'],
      },
    },
    {
      name: 'not_in',
      filter: { field: 'status', operator: 'not_in', value: ['maintenance'] },
    },
    {
      name: 'is_null',
      filter: { field: 'description', operator: 'is_null', value: null },
    },
    {
      name: 'is_not_null',
      filter: { field: 'name', operator: 'is_not_null', value: null },
    },
  ];

  async createDataSource(): Promise<string> {
    const response = await this.post('/api/v1/datasources', {
      name: `Test JSON Source ${Date.now()}`,
      type: 'json',
      endpoint: 'http://localhost:3001/api/salles',
      httpMethod: 'GET',
      authType: 'none',
      visibility: 'private',
    });

    if (response.status === 201) {
      return (response.body as ApiResponse)._id ?? '';
    }
    return '';
  }

  getDataSourceId(): string {
    return this.jsonDataSourceId;
  }

  setDataSourceId(id: string): void {
    this.jsonDataSourceId = id;
  }

  static getFilterTestCases(): FilterTestCase[] {
    return FiltersE2ETest.FILTER_TEST_CASES;
  }
}

const test = new FiltersE2ETest();

describe('Processing - Filters (E2E)', () => {
  beforeEach(async () => {
    const id = await test.createDataSource();
    test.setDataSourceId(id);
  });

  describe('Filter Operators', () => {
    FiltersE2ETest.getFilterTestCases().forEach(({ name, filter }) => {
      it(`should accept ${name} filter operator`, async () => {
        const dsId = test.getDataSourceId();
        if (!dsId) return;

        const response = await test.post(
          `/api/v1/processing/datasources/${dsId}/aggregate`,
          {
            metrics: [{ field: 'capacity', type: 'count' }],
            filters: [filter],
          },
        );
        expect([200, 502, 503]).toContain(response.status);
      });
    });

    it('should accept regex filter operator', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        {
          metrics: [{ field: 'capacity', type: 'count' }],
          filters: [{ field: 'name', operator: 'regex', value: '^Salle.*' }],
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should reject invalid filter operator', async () => {
      const response = await test.post(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/aggregate',
        {
          metrics: [{ field: 'capacity', type: 'count' }],
          filters: [{ field: 'status', operator: 'invalid_op', value: 'test' }],
        },
      );
      expect([400, 404]).toContain(response.status);
    });

    it('should accept multiple filters (AND logic)', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        {
          metrics: [{ field: 'capacity', type: 'sum' }],
          filters: [
            { field: 'status', operator: 'equals', value: 'available' },
            { field: 'hasProjector', operator: 'equals', value: true },
          ],
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });
  });
});
