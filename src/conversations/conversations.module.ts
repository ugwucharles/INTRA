import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MetaModule } from '../meta/meta.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [MetaModule, EmailModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
