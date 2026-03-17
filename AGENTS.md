# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Monorepo shape
- Root app: NestJS backend (`src/`) with Prisma/PostgreSQL.
- Frontend app: Next.js (`frontend/src/`), configured to run on port `3001`.
- Backend is the API + channel ingestion layer (Meta + Email) and emits real-time events via Socket.IO; frontend consumes REST + Socket.IO.

## Commands used for development

### Backend (run from repository root)
- Install deps: `npm install`
- Build: `npm run build`
- Dev server (watch): `npm run start:dev`
- Production run: `npm run start:prod`
- Lint (auto-fix enabled): `npm run lint`
- Format: `npm run format`
- Unit tests: `npm run test`
- Unit tests (single file): `npm run test -- src/<path>/<name>.spec.ts`
- E2E tests: `npm run test:e2e`
- E2E test (single file): `npm run test:e2e -- test/<name>.e2e-spec.ts`
- Coverage: `npm run test:cov`
- Prisma generate: `npx prisma generate`
- Prisma migrations (deploy existing): `npx prisma migrate deploy`
- Seed data: `npm run prisma:seed`

### Frontend (from repository root)
- Install deps: `npm --prefix frontend install`
- Dev server (port 3001): `npm --prefix frontend run dev`
- Build: `npm --prefix frontend run build`
- Start built app: `npm --prefix frontend run start`
- Lint: `npm --prefix frontend run lint`

## Required runtime configuration
- Backend validates these env vars at startup in `src/main.ts`: `DATABASE_URL`, `JWT_SECRET`, `META_VERIFY_TOKEN`, `META_DEFAULT_ORG_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`.
- Email ingestion/reply paths also require IMAP/SMTP env vars (`EMAIL_IMAP_*`, `EMAIL_SMTP_*`, `EMAIL_ADDRESS`, `EMAIL_PASSWORD`) in `src/email/email.service.ts`.
- Redis is optional: if `REDIS_URL` is unset, BullMQ outbound queue is disabled (`src/meta/meta.outbound-queue.ts`).
- Frontend expects `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`) in `frontend/src/lib/api.ts`.

## High-level architecture

### Backend composition
- `src/app.module.ts` wires domain modules: auth, staff, customers, conversations, messages, routing, tags, saved replies, meta, email, socket, prisma.
- `src/prisma/prisma.service.ts` creates PrismaClient using `@prisma/adapter-pg` and `DATABASE_URL`.
- Data model is multi-tenant by `orgId` across core entities (`Organization`, `User`, `Customer`, `Conversation`, etc.) in `prisma/schema.prisma`.

### Conversation/message lifecycle
- Inbound channels:
  - Meta webhooks (Messenger, Instagram, WhatsApp) handled in `src/meta/meta.service.ts`.
  - Email inbound is long-lived IMAP polling/IDLE in `src/email/email.service.ts`.
- For inbound messages, services upsert/find customer, find/create open conversation, insert message with idempotency key (`@@unique([conversationId, externalId])`), increment unread count, and update conversation timestamps.
- Outbound staff replies are created in `src/messages/messages.service.ts`, then dispatched by channel:
  - Meta channels via `MetaService.sendOutboundTextMessage(...)`.
  - Email via `EmailService.sendReply(...)`.
- Real-time updates are emitted by `SocketGateway` (`conversation_updated`, `new_message_<conversationId>`), and frontend listens in `frontend/src/components/providers/SocketProvider.tsx`.

### Routing and auto-replies
- Department routing is orchestrated by `src/routing/routing.service.ts` and `routing-settings.service.ts`.
- Routing behavior depends on `RoutingSettings` + metadata flags and can choose agents by least-open-conversations strategy, with fallback behavior (`NONE`, `ASSIGN_ANY_AGENT`, `ASSIGN_ADMIN`).
- Auto-reply triggers (`FIRST_MESSAGE`, `DEPARTMENT_SELECTION`, `NO_AGENT_AVAILABLE`, `AFTER_HOURS`) are applied during inbound processing in `MetaService`.

### Frontend data flow
- API access is centralized in `frontend/src/lib/api.ts` (token from `localStorage`, `Authorization: Bearer` header).
- Auth/session state is managed in `frontend/src/contexts/AuthContext.tsx` (login/register/me, online/offline status updates, idle timeout behavior).
- Dashboard pages under `frontend/src/app/dashboard/*` call API clients and react to socket events for live conversation updates (see `frontend/src/app/dashboard/page.tsx`).
