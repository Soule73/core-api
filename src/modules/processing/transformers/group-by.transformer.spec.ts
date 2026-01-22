import { describe, it, expect, beforeEach } from 'vitest';
import { GroupByTransformer } from './group-by.transformer';
import { BucketConfig } from './transformer.interface';

describe('GroupByTransformer', () => {
  let transformer: GroupByTransformer;

  const testData = [
    { category: 'A', region: 'North', value: 100 },
    { category: 'A', region: 'South', value: 150 },
    { category: 'B', region: 'North', value: 200 },
    { category: 'A', region: 'North', value: 120 },
    { category: 'B', region: 'South', value: 180 },
  ];

  beforeEach(() => {
    transformer = new GroupByTransformer();
  });

  describe('groupBy', () => {
    it('should return single group when no buckets', () => {
      const result = transformer.groupBy(testData, []);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('_all');
      expect(result[0].items).toHaveLength(5);
    });

    it('should group by single field', () => {
      const buckets: BucketConfig[] = [{ field: 'category' }];
      const result = transformer.groupBy(testData, buckets);
      expect(result).toHaveLength(2);

      const groupA = result.find((g) => g.key === 'A');
      const groupB = result.find((g) => g.key === 'B');
      expect(groupA?.items).toHaveLength(3);
      expect(groupB?.items).toHaveLength(2);
    });

    it('should group by multiple fields', () => {
      const buckets: BucketConfig[] = [
        { field: 'category' },
        { field: 'region' },
      ];
      const result = transformer.groupBy(testData, buckets);
      expect(result).toHaveLength(4);

      const groupAN = result.find((g) => g.key === 'A|North');
      expect(groupAN?.items).toHaveLength(2);
    });

    it('should handle null values', () => {
      const dataWithNull = [
        ...testData,
        { category: null, region: 'East', value: 50 },
      ];
      const buckets: BucketConfig[] = [{ field: 'category' }];
      const result = transformer.groupBy(dataWithNull, buckets);

      const nullGroup = result.find((g) => g.key === '_null');
      expect(nullGroup).toBeDefined();
      expect(nullGroup?.items).toHaveLength(1);
    });
  });

  describe('groupByAsMap', () => {
    it('should return a Map of groups', () => {
      const buckets: BucketConfig[] = [{ field: 'category' }];
      const result = transformer.groupByAsMap(testData, buckets);

      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(2);
      expect(result.get('A')).toHaveLength(3);
    });
  });

  describe('parseGroupKey', () => {
    it('should parse single field key', () => {
      const buckets: BucketConfig[] = [{ field: 'category' }];
      const parsed = transformer.parseGroupKey('A', buckets);
      expect(parsed).toEqual({ category: 'A' });
    });

    it('should parse multiple field key', () => {
      const buckets: BucketConfig[] = [
        { field: 'category' },
        { field: 'region' },
      ];
      const parsed = transformer.parseGroupKey('A|North', buckets);
      expect(parsed).toEqual({ category: 'A', region: 'North' });
    });
  });

  describe('date formatting', () => {
    const dateData = [
      { date: '2024-01-15T10:30:00Z', value: 100 },
      { date: '2024-01-15T14:00:00Z', value: 150 },
      { date: '2024-02-20T09:00:00Z', value: 200 },
    ];

    it('should group by year', () => {
      const buckets: BucketConfig[] = [{ field: 'date', format: 'year' }];
      const result = transformer.groupBy(dateData, buckets);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('2024');
    });

    it('should group by month', () => {
      const buckets: BucketConfig[] = [{ field: 'date', format: 'month' }];
      const result = transformer.groupBy(dateData, buckets);
      expect(result).toHaveLength(2);
    });

    it('should group by day', () => {
      const buckets: BucketConfig[] = [{ field: 'date', format: 'day' }];
      const result = transformer.groupBy(dateData, buckets);
      expect(result).toHaveLength(2);
    });
  });
});
