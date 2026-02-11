import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RoutingSettingsService } from './routing-settings.service';
import type { UpdateRoutingSettingsDto } from './routing-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('routing/settings')
export class RoutingSettingsController {
  constructor(private readonly routingSettingsService: RoutingSettingsService) {}

  @Get()
  async getSettings(@CurrentUser() currentUser: JwtPayload) {
    return this.routingSettingsService.getForOrg(currentUser);
  }

  @Patch()
  async updateSettings(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: UpdateRoutingSettingsDto,
  ) {
    return this.routingSettingsService.updateForOrg(currentUser, dto);
  }
}
