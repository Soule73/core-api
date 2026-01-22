import { Injectable } from '@nestjs/common';
import { IAggregator, AggregationType } from './aggregator.interface';

@Injectable()
export class CountAggregator implements IAggregator {
  getType(): AggregationType {
    return 'count';
  }

  aggregate(values: unknown[]): number {
    return values.filter((v) => v !== null && v !== undefined).length;
  }
}
