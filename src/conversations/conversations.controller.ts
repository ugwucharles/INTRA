import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationStatus } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async createConversation(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.createConversation(currentUser, dto);
  }

  @Get()
  async listConversations(@CurrentUser() currentUser: JwtPayload) {
    return this.conversationsService.listConversations(currentUser);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async assignConversation(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.conversationsService.assignConversation(currentUser, id, dto);
  }

  @Patch(':id/close')
  async closeConversation(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.conversationsService.closeConversation(currentUser, id);
  }

  @Patch(':id/star')
  async setStarred(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: { isStarred: boolean },
  ) {
    return this.conversationsService.setStarred(currentUser, id, body.isStarred);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: ConversationStatus },
  ) {
    return this.conversationsService.updateStatus(currentUser, id, body.status);
  }

  @Get(':id/tags')
  async getConversationTags(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.conversationsService.getConversationTags(currentUser, id);
  }

  @Post(':id/tags')
  async addConversationTag(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: { tagId: string },
  ) {
    return this.conversationsService.addConversationTag(currentUser, id, body.tagId);
  }

  @Delete(':id/tags/:tagId')
  async removeConversationTag(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.conversationsService.removeConversationTag(currentUser, id, tagId);
  }

  @Get(':id/notes')
  async listConversationNotes(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.conversationsService.listConversationNotes(currentUser, id);
  }

  @Post(':id/notes')
  async createConversationNote(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.conversationsService.createConversationNote(currentUser, id, body.content ?? '');
  }
}
