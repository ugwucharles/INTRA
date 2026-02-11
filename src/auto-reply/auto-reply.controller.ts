import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AutoReplyService } from './auto-reply.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AutoReplyTrigger } from '@prisma/client';

class CreateAutoReplyDto {
  trigger!: AutoReplyTrigger;
  departmentId?: string | null;
  message!: string;
  isActive?: boolean;
}

class UpdateAutoReplyDto {
  trigger?: AutoReplyTrigger;
  departmentId?: string | null;
  message?: string;
  isActive?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('routing/auto-replies')
export class AutoReplyController {
  constructor(private readonly autoReplyService: AutoReplyService) {}

  @Get()
  async list(@CurrentUser() currentUser: JwtPayload) {
    return this.autoReplyService.listForOrg(currentUser);
  }

  @Post()
  async create(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateAutoReplyDto) {
    return this.autoReplyService.createForOrg(currentUser, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAutoReplyDto,
  ) {
    return this.autoReplyService.updateForOrg(currentUser, id, dto);
  }
}
