import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PlansModule],
  controllers: [StaffController],
  providers: [StaffService, JwtAuthGuard, RolesGuard],
})
export class StaffModule {}
