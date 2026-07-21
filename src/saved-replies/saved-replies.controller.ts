import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SavedRepliesService } from './saved-replies.service';
import type {
  CreateSavedReplyDto,
  UpdateSavedReplyDto,
} from './saved-replies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('saved-replies')
export class SavedRepliesController {
  constructor(private readonly savedRepliesService: SavedRepliesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.AGENT)
  async listSavedReplies(
    @CurrentUser() currentUser: JwtPayload,
    @Query('departmentId') departmentId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const isActOnly = activeOnly === 'true';
    return this.savedRepliesService.listSavedReplies(currentUser, departmentId, isActOnly);
  }

  @Post()
  @Roles(Role.ADMIN)
  async createSavedReply(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateSavedReplyDto,
  ) {
    return this.savedRepliesService.createSavedReply(currentUser, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async updateSavedReply(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSavedReplyDto,
  ) {
    return this.savedRepliesService.updateSavedReply(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteSavedReply(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.savedRepliesService.deleteSavedReply(currentUser, id);
  }
}
