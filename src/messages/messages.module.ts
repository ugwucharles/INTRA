import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MetaModule } from '../meta/meta.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [MetaModule, EmailModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
