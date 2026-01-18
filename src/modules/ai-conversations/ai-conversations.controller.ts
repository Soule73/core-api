import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AIConversationsService } from './ai-conversations.service';
import {
  CreateAIConversationDto,
  UpdateAIConversationDto,
  AddMessageDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AIConversationResponse } from './interfaces';
import type { AuthUser } from '../auth/interfaces';

@ApiTags('AI Conversations')
@ApiBearerAuth('JWT-auth')
@Controller('ai/conversations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AIConversationsController {
  constructor(
    private readonly aiConversationsService: AIConversationsService,
  ) {}

  @Post()
  @RequirePermissions('widget:canCreate')
  @ApiOperation({ summary: 'Create a new AI conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createDto: CreateAIConversationDto,
  ): Promise<AIConversationResponse> {
    return this.aiConversationsService.create(user.id, createDto);
  }

  @Get()
  @RequirePermissions('widget:canView')
  @ApiOperation({ summary: 'Get all AI conversations for current user' })
  @ApiQuery({
    name: 'dataSourceId',
    required: false,
    description: 'Filter by data source',
  })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('dataSourceId') dataSourceId?: string,
  ): Promise<AIConversationResponse[]> {
    if (dataSourceId) {
      return this.aiConversationsService.findByDataSource(
        dataSourceId,
        user.id,
      );
    }
    return this.aiConversationsService.findAll(user.id);
  }

  @Get(':id')
  @RequirePermissions('widget:canView')
  @ApiOperation({ summary: 'Get AI conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation found' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<AIConversationResponse> {
    return this.aiConversationsService.findOne(id, user.id);
  }

  @Put(':id')
  @RequirePermissions('widget:canUpdate')
  @ApiOperation({ summary: 'Update AI conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateDto: UpdateAIConversationDto,
  ): Promise<AIConversationResponse> {
    return this.aiConversationsService.update(id, user.id, updateDto);
  }

  @Post(':id/messages')
  @RequirePermissions('widget:canUpdate')
  @ApiOperation({ summary: 'Add a message to an AI conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Message added' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async addMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() addMessageDto: AddMessageDto,
  ): Promise<AIConversationResponse> {
    return this.aiConversationsService.addMessage(id, user.id, addMessageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('widget:canDelete')
  @ApiOperation({ summary: 'Delete AI conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 204, description: 'Conversation deleted' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.aiConversationsService.remove(id, user.id);
  }
}
