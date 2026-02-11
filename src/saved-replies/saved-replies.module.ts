import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SavedRepliesService } from './saved-replies.service';
import { SavedRepliesController } from './saved-replies.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [SavedRepliesController],
  providers: [SavedRepliesService, JwtAuthGuard, RolesGuard],
})
export class SavedRepliesModule {}