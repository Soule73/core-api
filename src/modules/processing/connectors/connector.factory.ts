import { Injectable, Logger } from '@nestjs/common';
import {
  IDataConnector,
  DataSourceConfig,
  DataSourceType,
} from './connector.interface';
import { JsonConnector } from './json.connector';
import { CsvConnector } from './csv.connector';
import { ElasticsearchConnector } from './elasticsearch.connector';

@Injectable()
export class ConnectorFactory {
  private readonly logger = new Logger(ConnectorFactory.name);
  private readonly connectors: IDataConnector[];

  constructor(
    private readonly jsonConnector: JsonConnector,
    private readonly csvConnector: CsvConnector,
    private readonly elasticsearchConnector: ElasticsearchConnector,
  ) {
    this.connectors = [
      this.jsonConnector,
      this.csvConnector,
      this.elasticsearchConnector,
    ];
  }

  getConnector(type: DataSourceType): IDataConnector {
    const connector = this.connectors.find((c) => c.supports(type));

    if (!connector) {
      this.logger.error(`No connector found for type: ${type}`);
      throw new Error(`Unsupported data source type: ${type}`);
    }

    this.logger.debug(`Using ${type} connector`);
    return connector;
  }

  getConnectorForConfig(config: DataSourceConfig): IDataConnector {
    return this.getConnector(config.type);
  }

  getSupportedTypes(): DataSourceType[] {
    return ['json', 'csv', 'elasticsearch'];
  }
}
