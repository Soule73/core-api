import { Injectable, Logger } from '@nestjs/common';
import { BucketConfig, GroupedData } from './transformer.interface';

function safeToString(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') return JSON.stringify(val);
  if (typeof val === 'symbol') return val.toString();
  if (typeof val === 'function') return '[function]';
  return String(val as string | number | boolean | bigint);
}

@Injectable()
export class GroupByTransformer {
  private readonly logger = new Logger(GroupByTransformer.name);

  groupBy(
    data: Record<string, unknown>[],
    buckets: BucketConfig[],
  ): GroupedData[] {
    if (!buckets || buckets.length === 0) {
      return [{ key: '_all', items: data }];
    }

    const groups = new Map<string, Record<string, unknown>[]>();

    for (const row of data) {
      const key = this.buildGroupKey(row, buckets);

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    const result: GroupedData[] = [];
    for (const [key, items] of groups) {
      result.push({ key, items });
    }

    this.logger.debug(
      `Grouped ${data.length} rows into ${result.length} groups`,
    );
    return result;
  }

  groupByAsMap(
    data: Record<string, unknown>[],
    buckets: BucketConfig[],
  ): Map<string, Record<string, unknown>[]> {
    if (!buckets || buckets.length === 0) {
      return new Map([['_all', data]]);
    }

    const groups = new Map<string, Record<string, unknown>[]>();

    for (const row of data) {
      const key = this.buildGroupKey(row, buckets);

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    return groups;
  }

  private buildGroupKey(
    row: Record<string, unknown>,
    buckets: BucketConfig[],
  ): string {
    const keyParts = buckets.map((bucket) => {
      const value = row[bucket.field];
      return this.formatValue(value, bucket.format);
    });

    return keyParts.join('|');
  }

  private formatValue(value: unknown, format?: string): string {
    if (value === null || value === undefined) {
      return '_null';
    }

    if (format && this.isDateValue(value)) {
      return this.formatDate(value, format);
    }

    return safeToString(value);
  }

  private isDateValue(value: unknown): boolean {
    if (value instanceof Date) return true;
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }

  private formatDate(value: unknown, format: string): string {
    const date = value instanceof Date ? value : new Date(String(value));

    switch (format) {
      case 'year':
        return date.getFullYear().toString();
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        return this.getWeekString(date);
      case 'hour':
        return `${date.toISOString().split('T')[0]}T${String(date.getHours()).padStart(2, '0')}`;
      default:
        return date.toISOString();
    }
  }

  private getWeekString(date: Date): string {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const days = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    const week = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  parseGroupKey(key: string, buckets: BucketConfig[]): Record<string, string> {
    const parts = key.split('|');
    const result: Record<string, string> = {};

    buckets.forEach((bucket, index) => {
      result[bucket.field] = parts[index] ?? '_null';
    });

    return result;
  }
}
