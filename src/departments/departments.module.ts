import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PlansModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, JwtAuthGuard, RolesGuard],
})
export class DepartmentsModule {}
