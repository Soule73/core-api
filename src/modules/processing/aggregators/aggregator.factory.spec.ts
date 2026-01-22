import { describe, it, expect, beforeEach } from 'vitest';
import { AggregatorFactory } from './aggregator.factory';
import { SumAggregator } from './sum.aggregator';
import { AvgAggregator } from './avg.aggregator';
import { CountAggregator } from './count.aggregator';
import { MinAggregator } from './min.aggregator';
import { MaxAggregator } from './max.aggregator';

describe('AggregatorFactory', () => {
  let factory: AggregatorFactory;

  beforeEach(() => {
    factory = new AggregatorFactory(
      new SumAggregator(),
      new AvgAggregator(),
      new CountAggregator(),
      new MinAggregator(),
      new MaxAggregator(),
    );
  });

  describe('aggregate', () => {
    const testValues = [10, 20, 30, 40, 50];
    const mixedValues = [10, 'invalid', 30, null, 50];

    it('should calculate sum', () => {
      const result = factory.aggregate('sum', testValues);
      expect(result).toBe(150);
    });

    it('should calculate average', () => {
      const result = factory.aggregate('avg', testValues);
      expect(result).toBe(30);
    });

    it('should calculate count', () => {
      const result = factory.aggregate('count', testValues);
      expect(result).toBe(5);
    });

    it('should calculate min', () => {
      const result = factory.aggregate('min', testValues);
      expect(result).toBe(10);
    });

    it('should calculate max', () => {
      const result = factory.aggregate('max', testValues);
      expect(result).toBe(50);
    });

    it('should handle mixed values for sum', () => {
      const result = factory.aggregate('sum', mixedValues);
      expect(result).toBe(90);
    });

    it('should handle empty array', () => {
      expect(factory.aggregate('sum', [])).toBe(0);
      expect(factory.aggregate('avg', [])).toBe(null);
      expect(factory.aggregate('count', [])).toBe(0);
      expect(factory.aggregate('min', [])).toBe(null);
      expect(factory.aggregate('max', [])).toBe(null);
    });

    it('should throw for unsupported aggregation type', () => {
      expect(() => factory.aggregate('unknown' as 'sum', testValues)).toThrow();
    });
  });

  describe('getAggregator', () => {
    it('should return the correct aggregator', () => {
      expect(factory.getAggregator('sum')).toBeInstanceOf(SumAggregator);
      expect(factory.getAggregator('avg')).toBeInstanceOf(AvgAggregator);
      expect(factory.getAggregator('count')).toBeInstanceOf(CountAggregator);
      expect(factory.getAggregator('min')).toBeInstanceOf(MinAggregator);
      expect(factory.getAggregator('max')).toBeInstanceOf(MaxAggregator);
    });

    it('should throw for unknown type', () => {
      expect(() => factory.getAggregator('unknown' as 'sum')).toThrow();
    });
  });

  describe('getSupportedTypes', () => {
    it('should return all supported aggregation types', () => {
      const types = factory.getSupportedTypes();
      expect(types).toContain('sum');
      expect(types).toContain('avg');
      expect(types).toContain('count');
      expect(types).toContain('min');
      expect(types).toContain('max');
    });
  });
});
