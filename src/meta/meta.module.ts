import { Module } from '@nestjs/common';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { MetaOutboundQueue } from './meta.outbound-queue';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutingModule } from '../routing/routing.module';
import { SocketModule } from '../socket/socket.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    PrismaModule,
    PlansModule,
    RoutingModule,
    SocketModule,
    SocialAccountsModule,
  ],
  controllers: [MetaController],
  providers: [MetaService, MetaOutboundQueue],
  exports: [MetaService],
})
export class MetaModule {}
