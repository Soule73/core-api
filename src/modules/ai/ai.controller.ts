import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AIService } from './ai.service';
import { GenerateWidgetDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AIGenerationResult } from './interfaces';
import type { AuthUser } from '../auth/interfaces';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {
    //
  }

  @Post('generate-widget')
  @RequirePermissions('widget:canCreate')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @ApiOperation({ summary: 'Generate a widget using AI from a data source' })
  @ApiResponse({
    status: 201,
    description: 'Widget generated successfully as draft',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid config',
  })
  @ApiResponse({ status: 503, description: 'OpenAI API unavailable' })
  async generateWidget(
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateWidgetDto,
  ): Promise<AIGenerationResult> {
    return this.aiService.generateWidget(user.id, dto);
  }
}
