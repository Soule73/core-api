import { Injectable } from '@nestjs/common';
import { IAggregator, AggregationType } from './aggregator.interface';

@Injectable()
export class AvgAggregator implements IAggregator {
  getType(): AggregationType {
    return 'avg';
  }

  aggregate(values: unknown[]): number | null {
    const numbers = values
      .map((v) => this.toNumber(v))
      .filter((n): n is number => n !== null);

    if (numbers.length === 0) return null;

    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }
}
