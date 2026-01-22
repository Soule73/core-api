import { Injectable, Logger } from '@nestjs/common';
import { Filter, FilterResult, FilterOperator } from './filter.interface';

function safeToString(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') return JSON.stringify(val);
  if (typeof val === 'symbol') return val.toString();
  if (typeof val === 'function') return '[function]';
  return String(val as string | number | boolean | bigint);
}

@Injectable()
export class FilterEngine {
  private readonly logger = new Logger(FilterEngine.name);

  applyFilters(
    data: Record<string, unknown>[],
    filters: Filter[],
  ): FilterResult {
    if (!filters || filters.length === 0) {
      return { data, count: data.length };
    }

    const filtered = filters.reduce((result, filter) => {
      return this.applyFilter(result, filter);
    }, data);

    return { data: filtered, count: filtered.length };
  }

  private applyFilter(
    data: Record<string, unknown>[],
    filter: Filter,
  ): Record<string, unknown>[] {
    const { field, operator, value } = filter;
    this.logger.debug(`Applying filter: ${field} ${operator} ${String(value)}`);

    return data.filter((row) =>
      this.evaluateCondition(row, field, operator, value),
    );
  }

  private evaluateCondition(
    row: Record<string, unknown>,
    field: string,
    operator: FilterOperator,
    value: unknown,
  ): boolean {
    const fieldValue = row[field];

    switch (operator) {
      case 'equals':
        return this.equals(fieldValue, value);

      case 'not_equals':
        return !this.equals(fieldValue, value);

      case 'contains':
        return this.contains(fieldValue, value);

      case 'not_contains':
        return !this.contains(fieldValue, value);

      case 'greater_than':
        return this.compare(fieldValue, value) > 0;

      case 'less_than':
        return this.compare(fieldValue, value) < 0;

      case 'greater_than_or_equal':
        return this.compare(fieldValue, value) >= 0;

      case 'less_than_or_equal':
        return this.compare(fieldValue, value) <= 0;

      case 'between':
        return this.between(fieldValue, value);

      case 'in':
        return this.inArray(fieldValue, value);

      case 'not_in':
        return !this.inArray(fieldValue, value);

      case 'regex':
        return this.matchesRegex(fieldValue, value);

      case 'is_null':
        return fieldValue === null || fieldValue === undefined;

      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;

      default:
        this.logger.warn(`Unknown operator: ${String(operator)}`);
        return true;
    }
  }

  private equals(fieldValue: unknown, value: unknown): boolean {
    if (fieldValue === value) return true;

    const fieldStr = safeToString(fieldValue);
    const valueStr = safeToString(value);
    return fieldStr.toLowerCase() === valueStr.toLowerCase();
  }

  private contains(fieldValue: unknown, value: unknown): boolean {
    if (fieldValue === null || fieldValue === undefined) return false;

    const fieldStr = safeToString(fieldValue);
    const valueStr = safeToString(value).toLowerCase();
    return fieldStr.toLowerCase().includes(valueStr);
  }

  private compare(fieldValue: unknown, value: unknown): number {
    const numField = this.toNumber(fieldValue);
    const numValue = this.toNumber(value);

    if (numField !== null && numValue !== null) {
      return numField - numValue;
    }

    const dateField = this.toDate(fieldValue);
    const dateValue = this.toDate(value);

    if (dateField && dateValue) {
      return dateField.getTime() - dateValue.getTime();
    }

    return safeToString(fieldValue).localeCompare(safeToString(value));
  }

  private between(fieldValue: unknown, value: unknown): boolean {
    if (!Array.isArray(value) || value.length !== 2) {
      this.logger.warn('Between operator requires array with 2 values');
      return false;
    }

    const [min, max] = value as [unknown, unknown];
    return (
      this.compare(fieldValue, min) >= 0 && this.compare(fieldValue, max) <= 0
    );
  }

  private inArray(fieldValue: unknown, value: unknown): boolean {
    if (!Array.isArray(value)) {
      return this.equals(fieldValue, value);
    }

    return value.some((v) => this.equals(fieldValue, v));
  }

  private matchesRegex(fieldValue: unknown, value: unknown): boolean {
    if (fieldValue === null || fieldValue === undefined) return false;

    try {
      const regex = new RegExp(safeToString(value), 'i');
      const strValue = safeToString(fieldValue);
      return regex.test(strValue);
    } catch {
      this.logger.warn(`Invalid regex pattern: ${safeToString(value)}`);
      return false;
    }
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  filterByTimestamp(
    data: Record<string, unknown>[],
    timestampField: string,
    from?: string,
    to?: string,
  ): Record<string, unknown>[] {
    if (!timestampField || (!from && !to)) {
      return data;
    }

    return data.filter((row) => {
      const ts = row[timestampField];
      if (!ts) return false;

      const date = this.toDate(ts);
      if (!date) return false;

      if (from && date < new Date(from)) return false;
      if (to && date > new Date(to)) return false;

      return true;
    });
  }

  selectFields(
    data: Record<string, unknown>[],
    fields?: string,
  ): Record<string, unknown>[] {
    if (!fields) return data;

    const fieldList = fields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    if (fieldList.length === 0) return data;

    return data.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([key]) => fieldList.includes(key)),
      ),
    );
  }

  paginate(
    data: Record<string, unknown>[],
    page?: number,
    pageSize?: number,
  ): { data: Record<string, unknown>[]; total: number } {
    const total = data.length;

    if (!page || !pageSize) {
      return { data, total };
    }

    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
    };
  }
}
