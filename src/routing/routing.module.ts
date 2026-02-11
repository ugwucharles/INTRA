import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutingService } from './routing.service';
import { RoutingSettingsService } from './routing-settings.service';
import { RoutingSettingsController } from './routing-settings.controller';
import { AutoReplyService } from '../auto-reply/auto-reply.service';
import { AutoReplyController } from '../auto-reply/auto-reply.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [RoutingSettingsController, AutoReplyController],
  providers: [RoutingService, RoutingSettingsService, AutoReplyService, JwtAuthGuard, RolesGuard],
  exports: [RoutingService, RoutingSettingsService, AutoReplyService],
})
export class RoutingModule {}
