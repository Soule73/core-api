import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaAnalyzerService } from './schema-analyzer.service';
import { TypeDetector } from './detectors/type.detector';
import { CardinalityDetector } from './detectors/cardinality.detector';
import { SampleExtractor } from './detectors/sample.extractor';

describe('SchemaAnalyzerService', () => {
  let service: SchemaAnalyzerService;

  const testData = [
    {
      id: 1,
      name: 'Alice',
      age: 25,
      active: true,
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Bob',
      age: 30,
      active: false,
      createdAt: '2024-02-20',
    },
    {
      id: 3,
      name: 'Charlie',
      age: 35,
      active: true,
      createdAt: '2024-03-25',
    },
  ];

  beforeEach(() => {
    const typeDetector = new TypeDetector();
    const cardinalityDetector = new CardinalityDetector();
    const sampleExtractor = new SampleExtractor();

    service = new SchemaAnalyzerService(
      typeDetector,
      cardinalityDetector,
      sampleExtractor,
    );
  });

  describe('analyzeSchema', () => {
    it('should analyze all columns', () => {
      const result = service.analyzeSchema(testData);

      expect(result.columns).toHaveLength(5);
      expect(result.rowCount).toBe(3);
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('should detect column types correctly', () => {
      const result = service.analyzeSchema(testData);

      const idCol = result.columns.find((c) => c.name === 'id');
      const nameCol = result.columns.find((c) => c.name === 'name');
      const ageCol = result.columns.find((c) => c.name === 'age');
      const activeCol = result.columns.find((c) => c.name === 'active');
      const dateCol = result.columns.find((c) => c.name === 'createdAt');

      expect(idCol?.type).toBe('number');
      expect(nameCol?.type).toBe('string');
      expect(ageCol?.type).toBe('number');
      expect(activeCol?.type).toBe('boolean');
      expect(dateCol?.type).toBe('date');
    });

    it('should calculate cardinality', () => {
      const result = service.analyzeSchema(testData);

      const nameCol = result.columns.find((c) => c.name === 'name');
      expect(nameCol?.uniqueCount).toBe(3);
      expect(nameCol?.cardinality).toBe(1);
    });

    it('should extract samples', () => {
      const result = service.analyzeSchema(testData, { sampleSize: 2 });

      const nameCol = result.columns.find((c) => c.name === 'name');
      expect(nameCol?.samples.length).toBeLessThanOrEqual(2);
    });

    it('should calculate min/max for numeric columns', () => {
      const result = service.analyzeSchema(testData);

      const ageCol = result.columns.find((c) => c.name === 'age');
      expect(ageCol?.minValue).toBe(25);
      expect(ageCol?.maxValue).toBe(35);
      expect(ageCol?.avgValue).toBe(30);
    });

    it('should handle empty data', () => {
      const result = service.analyzeSchema([]);

      expect(result.columns).toHaveLength(0);
      expect(result.rowCount).toBe(0);
    });
  });

  describe('quickAnalyze', () => {
    it('should return column names and types', () => {
      const result = service.quickAnalyze(testData);

      expect(result).toHaveLength(5);
      expect(result.some((c) => c.name === 'id' && c.type === 'number')).toBe(
        true,
      );
      expect(result.some((c) => c.name === 'name' && c.type === 'string')).toBe(
        true,
      );
    });

    it('should handle empty data', () => {
      const result = service.quickAnalyze([]);
      expect(result).toHaveLength(0);
    });
  });
});

describe('TypeDetector', () => {
  let detector: TypeDetector;

  beforeEach(() => {
    detector = new TypeDetector();
  });

  describe('detectType', () => {
    it('should detect null', () => {
      expect(detector.detectType(null)).toBe('null');
      expect(detector.detectType(undefined)).toBe('null');
      expect(detector.detectType('')).toBe('null');
    });

    it('should detect boolean', () => {
      expect(detector.detectType(true)).toBe('boolean');
      expect(detector.detectType(false)).toBe('boolean');
    });

    it('should detect number', () => {
      expect(detector.detectType(42)).toBe('number');
      expect(detector.detectType(3.14)).toBe('number');
      expect(detector.detectType('123')).toBe('number');
    });

    it('should detect date strings', () => {
      expect(detector.detectType('2024-01-15')).toBe('date');
      expect(detector.detectType('2024-01-15T10:30:00')).toBe('date');
    });

    it('should detect JavaScript Date instances as date', () => {
      expect(detector.detectType(new Date())).toBe('date');
      expect(detector.detectType(new Date('2024-01-15'))).toBe('date');
    });

    it('should detect MongoDB Extended JSON date objects as date', () => {
      expect(detector.detectType({ $date: '2026-04-18T03:11:13.303Z' })).toBe('date');
      expect(detector.detectType({ $date: { $numberLong: '1713408673303' } })).toBe('date');
    });

    it('should detect string', () => {
      expect(detector.detectType('hello')).toBe('string');
    });

    it('should detect array', () => {
      expect(detector.detectType([1, 2, 3])).toBe('array');
    });

    it('should detect object', () => {
      expect(detector.detectType({ key: 'value' })).toBe('object');
    });
  });

  describe('inferColumnType', () => {
    it('should infer dominant type', () => {
      expect(detector.inferColumnType([1, 2, 3, 4, 5])).toBe('number');
      expect(detector.inferColumnType(['a', 'b', 'c'])).toBe('string');
    });

    it('should return null for empty values', () => {
      expect(detector.inferColumnType([null, undefined, ''])).toBe('null');
    });

    it('should handle mixed types', () => {
      const result = detector.inferColumnType([1, 'a', true, null, {}]);
      expect(result).toBe('mixed');
    });
  });
});

describe('CardinalityDetector', () => {
  let detector: CardinalityDetector;

  beforeEach(() => {
    detector = new CardinalityDetector();
  });

  describe('calculate', () => {
    it('should calculate unique count', () => {
      const result = detector.calculate(['a', 'b', 'a', 'c', 'b']);
      expect(result.uniqueCount).toBe(3);
      expect(result.totalCount).toBe(5);
      expect(result.cardinality).toBe(0.6);
    });

    it('should detect high cardinality', () => {
      const values = Array.from({ length: 10 }, (_, i) => `item${i}`);
      const result = detector.calculate(values);
      expect(result.isHighCardinality).toBe(true);
    });
  });

  describe('getUniqueValues', () => {
    it('should return unique values', () => {
      const result = detector.getUniqueValues(['a', 'b', 'a', 'c']);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should respect maxCount limit', () => {
      const values = ['a', 'b', 'c', 'd', 'e'];
      const result = detector.getUniqueValues(values, 3);
      expect(result).toHaveLength(3);
    });
  });
});

describe('SampleExtractor', () => {
  let extractor: SampleExtractor;

  beforeEach(() => {
    extractor = new SampleExtractor();
  });

  describe('extractSamples', () => {
    it('should extract samples', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = extractor.extractSamples(values, 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should skip null values', () => {
      const values = [null, 1, undefined, 2, '', 3];
      const result = extractor.extractSamples(values, 5);
      expect(result.every((v) => v !== null && v !== undefined)).toBe(true);
    });
  });

  describe('extractMinMax', () => {
    it('should find min and max', () => {
      const values = [5, 2, 8, 1, 9];
      const result = extractor.extractMinMax(values);
      expect(result.min).toBe(1);
      expect(result.max).toBe(9);
    });

    it('should handle empty array', () => {
      const result = extractor.extractMinMax([]);
      expect(result.min).toBeUndefined();
      expect(result.max).toBeUndefined();
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average', () => {
      const result = extractor.calculateAverage([10, 20, 30]);
      expect(result).toBe(20);
    });

    it('should handle empty array', () => {
      const result = extractor.calculateAverage([]);
      expect(result).toBeUndefined();
    });
  });
});
