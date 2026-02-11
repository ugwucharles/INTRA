import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { CustomersModule } from './customers/customers.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { MetaModule } from './meta/meta.module';
import { HealthController } from './health/health.controller';
import { DepartmentsModule } from './departments/departments.module';
import { RoutingModule } from './routing/routing.module';
import { TagsModule } from './tags/tags.module';
import { SavedRepliesModule } from './saved-replies/saved-replies.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StaffModule,
    CustomersModule,
    ConversationsModule,
    MessagesModule,
    MetaModule,
    DepartmentsModule,
    RoutingModule,
    TagsModule,
    SavedRepliesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
