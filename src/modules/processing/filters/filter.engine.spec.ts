import { describe, it, expect, beforeEach } from 'vitest';
import { FilterEngine } from './filter.engine';
import { Filter } from './filter.interface';

describe('FilterEngine', () => {
  let filterEngine: FilterEngine;

  const testData = [
    { id: 1, name: 'Alice', age: 25, city: 'Paris', active: true },
    { id: 2, name: 'Bob', age: 30, city: 'London', active: false },
    { id: 3, name: 'Charlie', age: 35, city: 'Paris', active: true },
    { id: 4, name: 'Diana', age: 28, city: 'Berlin', active: null },
    { id: 5, name: 'Eve', age: 22, city: 'Paris', active: true },
  ];

  beforeEach(() => {
    filterEngine = new FilterEngine();
  });

  describe('applyFilters', () => {
    it('should return all data when no filters provided', () => {
      const result = filterEngine.applyFilters(testData, []);
      expect(result.data).toHaveLength(5);
      expect(result.count).toBe(5);
    });

    it('should filter by equals operator', () => {
      const filters: Filter[] = [
        { field: 'city', operator: 'equals', value: 'Paris' },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(3);
      expect(result.data.every((row) => row.city === 'Paris')).toBe(true);
    });

    it('should filter by not_equals operator', () => {
      const filters: Filter[] = [
        { field: 'city', operator: 'not_equals', value: 'Paris' },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by contains operator', () => {
      const filters: Filter[] = [
        { field: 'name', operator: 'contains', value: 'li' },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by greater_than operator', () => {
      const filters: Filter[] = [
        { field: 'age', operator: 'greater_than', value: 28 },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by less_than operator', () => {
      const filters: Filter[] = [
        { field: 'age', operator: 'less_than', value: 28 },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by between operator', () => {
      const filters: Filter[] = [
        { field: 'age', operator: 'between', value: [25, 30] },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(3);
    });

    it('should filter by in operator', () => {
      const filters: Filter[] = [
        { field: 'city', operator: 'in', value: ['Paris', 'Berlin'] },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(4);
    });

    it('should filter by is_null operator', () => {
      const filters: Filter[] = [
        { field: 'active', operator: 'is_null', value: null },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Diana');
    });

    it('should filter by is_not_null operator', () => {
      const filters: Filter[] = [
        { field: 'active', operator: 'is_not_null', value: null },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(4);
    });

    it('should filter by regex operator', () => {
      const filters: Filter[] = [
        { field: 'name', operator: 'regex', value: '^[A-C]' },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(3);
    });

    it('should apply multiple filters', () => {
      const filters: Filter[] = [
        { field: 'city', operator: 'equals', value: 'Paris' },
        { field: 'age', operator: 'greater_than', value: 23 },
      ];
      const result = filterEngine.applyFilters(testData, filters);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('filterByTimestamp', () => {
    const dateData = [
      { id: 1, date: '2024-01-15' },
      { id: 2, date: '2024-02-20' },
      { id: 3, date: '2024-03-25' },
    ];

    it('should filter by date range', () => {
      const result = filterEngine.filterByTimestamp(
        dateData,
        'date',
        '2024-02-01',
        '2024-03-01',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should return all data if no timestamp field', () => {
      const result = filterEngine.filterByTimestamp(
        dateData,
        '',
        '2024-02-01',
        '2024-03-01',
      );
      expect(result).toHaveLength(3);
    });
  });

  describe('selectFields', () => {
    it('should select specific fields', () => {
      const result = filterEngine.selectFields(testData, 'name,age');
      expect(Object.keys(result[0])).toEqual(['name', 'age']);
    });

    it('should return all fields if no selection', () => {
      const result = filterEngine.selectFields(testData);
      expect(Object.keys(result[0])).toEqual([
        'id',
        'name',
        'age',
        'city',
        'active',
      ]);
    });
  });

  describe('paginate', () => {
    it('should paginate data', () => {
      const result = filterEngine.paginate(testData, 2, 2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(3);
      expect(result.total).toBe(5);
    });

    it('should return all data if no pagination params', () => {
      const result = filterEngine.paginate(testData);
      expect(result.data).toHaveLength(5);
    });
  });
});
