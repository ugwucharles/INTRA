import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [TagsController],
  providers: [TagsService, JwtAuthGuard, RolesGuard],
  exports: [TagsService],
})
export class TagsModule {}
