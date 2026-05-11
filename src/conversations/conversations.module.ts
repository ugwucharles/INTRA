import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MetaModule } from '../meta/meta.module';
import { EmailModule } from '../email/email.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [MetaModule, EmailModule, PlansModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
