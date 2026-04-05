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
import { TagsService } from './tags.service';
import type { CreateTagDto, UpdateTagDto } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async listTags(
    @CurrentUser() currentUser: JwtPayload,
    @Query('type') type?: string,
  ) {
    return this.tagsService.listTags(currentUser, type as any);
  }

  @Post()
  async createTag(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.createTag(currentUser, dto);
  }

  @Patch(':id')
  async updateTag(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagsService.updateTag(currentUser, id, dto);
  }

  @Delete(':id')
  async deleteTag(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.tagsService.deleteTag(currentUser, id);
  }
}
