import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { EmailModule } from './email/email.module';
import { SocketModule } from './socket/socket.module';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';
import { TenantContextInterceptor } from './tenancy/tenant-context.interceptor';

@Module({
  imports: [
    // Rate limiting — max 60 requests per minute per IP globally
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
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
    EmailModule,
    SocketModule,
    SocialAccountsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // Apply rate limiting globally to every endpoint
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Provide per-request tenant context (orgId) for Prisma enforcement
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
