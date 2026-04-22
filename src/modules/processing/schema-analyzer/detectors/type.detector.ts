import { Injectable } from '@nestjs/common';
import { ColumnType } from '../interfaces';

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{2}-\d{2}-\d{4}$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  /^\d{4}\/\d{2}\/\d{2}$/,
];

@Injectable()
export class TypeDetector {
  detectType(value: unknown): ColumnType {
    if (value === null) return 'null';
    if (value === undefined) return 'null';

    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (
      typeof value === 'object' &&
      value !== null &&
      '$date' in (value as Record<string, unknown>)
    )
      return 'date';
    if (typeof value === 'object') return 'object';

    if (typeof value === 'string') {
      if (value === '') return 'null';
      if (this.isDateString(value)) return 'date';
      if (this.isNumericString(value)) return 'number';
      return 'string';
    }

    return 'string';
  }

  inferColumnType(values: unknown[]): ColumnType {
    const typeCount = new Map<ColumnType, number>();

    for (const value of values) {
      const type = this.detectType(value);
      if (type !== 'null') {
        typeCount.set(type, (typeCount.get(type) ?? 0) + 1);
      }
    }

    if (typeCount.size === 0) return 'null';
    if (typeCount.size === 1) {
      const firstKey = typeCount.keys().next();
      return firstKey.value as ColumnType;
    }

    if (
      typeCount.size === 2 &&
      typeCount.has('number') &&
      typeCount.has('string')
    ) {
      const numCount = typeCount.get('number') ?? 0;
      const strCount = typeCount.get('string') ?? 0;
      if (numCount > strCount * 2) return 'number';
    }

    let maxType: ColumnType = 'string';
    let maxCount = 0;

    for (const [type, count] of typeCount) {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    }

    if (typeCount.size > 2) return 'mixed';

    return maxType;
  }

  private isDateString(value: string): boolean {
    for (const pattern of DATE_PATTERNS) {
      if (pattern.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return true;
      }
    }
    return false;
  }

  private isNumericString(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed === '') return false;
    const num = Number(trimmed);
    return !isNaN(num) && isFinite(num);
  }
}
