import { Injectable } from '@nestjs/common';
import { IAggregator, AggregationType } from './aggregator.interface';

@Injectable()
export class MinAggregator implements IAggregator {
  getType(): AggregationType {
    return 'min';
  }

  aggregate(values: unknown[]): number | null {
    const numbers = values
      .map((v) => this.toNumber(v))
      .filter((n): n is number => n !== null);

    if (numbers.length === 0) return null;

    return Math.min(...numbers);
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
