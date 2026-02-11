import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from './role.enum';
import { CurrentUser } from './current-user.decorator';

@Controller()
export class RolesExampleController {
  @Get('admin/ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminPing(
    @CurrentUser('userId') userId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return {
      message: 'admin pong',
      userId,
      orgId,
    };
  }

  @Get('agent/ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AGENT)
  agentPing(
    @CurrentUser('userId') userId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('role') role: Role,
  ) {
    return {
      message: 'agent pong',
      userId,
      orgId,
      role,
    };
  }
}
