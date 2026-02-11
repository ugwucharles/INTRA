import { Module } from '@nestjs/common';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { MetaOutboundQueue } from './meta.outbound-queue';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [PrismaModule, RoutingModule],
  controllers: [MetaController],
  providers: [MetaService, MetaOutboundQueue],
  exports: [MetaService],
})
export class MetaModule {}
