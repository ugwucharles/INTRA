import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [PrismaModule, RoutingModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
