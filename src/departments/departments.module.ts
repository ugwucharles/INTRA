import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, JwtAuthGuard, RolesGuard],
})
export class DepartmentsModule {}
