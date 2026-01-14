import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'API health check',
    description: 'Returns the health status of the Core API with timestamp',
  })
  @ApiResponse({
    status: 200,
    description: 'API is operational',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-14T21:20:41.565Z',
        },
        service: { type: 'string', example: 'core-api' },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'core-api',
    };
  }
}
