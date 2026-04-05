/**
 * Tenant Isolation Integration Tests
 *
 * These tests verify that two organizations created in the same database
 * have completely separate data — channels, customers, conversations,
 * messages, and all related entities.
 *
 * Run with:  npx jest test/tenant-isolation.e2e-spec.ts --runInBand
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContext } from '../src/tenancy/tenant-context';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens & IDs populated by setup
  let orgA: { id: string; token: string };
  let orgB: { id: string; token: string };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);

    // ── Create Organization A ────────────────────────────────────────
    const resA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: 'Org A',
        name: 'Admin A',
        email: 'admin-a@test.com',
        password: 'password123',
        country: 'US',
        phone: '+1111111111',
      })
      .expect(201);

    orgA = {
      id: resA.body.organization.id,
      token: resA.body.access_token,
    };

    // ── Create Organization B ────────────────────────────────────────
    const resB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: 'Org B',
        name: 'Admin B',
        email: 'admin-b@test.com',
        password: 'password123',
        country: 'UK',
        phone: '+2222222222',
      })
      .expect(201);

    orgB = {
      id: resB.body.organization.id,
      token: resB.body.access_token,
    };
  });

  afterAll(async () => {
    // Clean up test orgs (bypass tenant enforcement for cleanup)
    await TenantContext.run({ bypassTenantEnforcement: true }, async () => {
      for (const orgId of [orgA.id, orgB.id]) {
        await prisma.message.deleteMany({ where: { orgId } });
        await prisma.conversationTag.deleteMany({ where: { orgId } });
        await prisma.conversationNote.deleteMany({ where: { orgId } });
        await prisma.conversation.deleteMany({ where: { orgId } });
        await prisma.customerTag.deleteMany({ where: { orgId } });
        await prisma.customerNote.deleteMany({ where: { orgId } });
        await prisma.customer.deleteMany({ where: { orgId } });
        await prisma.socialAccount.deleteMany({ where: { orgId } });
        await prisma.savedReply.deleteMany({ where: { orgId } });
        await prisma.autoReply.deleteMany({ where: { orgId } });
        await prisma.routingSettings.deleteMany({ where: { orgId } });
        await prisma.department.deleteMany({ where: { orgId } });
        await prisma.tag.deleteMany({ where: { orgId } });
        await prisma.auditLog.deleteMany({ where: { orgId } });
        await prisma.user.deleteMany({ where: { orgId } });
        await prisma.organization.deleteMany({ where: { id: orgId } });
      }
    });

    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────
  // 1. Social accounts (channels) are fully isolated
  // ─────────────────────────────────────────────────────────────────

  it('should create a social account in Org A and NOT see it in Org B', async () => {
    // Create a social account directly in Org A
    await request(app.getHttpServer())
      .post('/social-accounts')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({
        channel: 'FACEBOOK_MESSENGER',
        displayName: 'OrgA Facebook Page',
        pageId: 'page-a-123',
        accessToken: 'fake-token-a',
      })
      .expect(201);

    // List Org A's social accounts — should find 1
    const resA = await request(app.getHttpServer())
      .get('/social-accounts')
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);

    expect(resA.body.length).toBeGreaterThanOrEqual(1);
    expect(resA.body.some((a: any) => a.pageId === 'page-a-123')).toBe(true);

    // List Org B's social accounts — should find 0
    const resB = await request(app.getHttpServer())
      .get('/social-accounts')
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(200);

    expect(resB.body.some((a: any) => a.pageId === 'page-a-123')).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. Customers are fully isolated
  // ─────────────────────────────────────────────────────────────────

  it('should create a customer in Org A and NOT see it in Org B', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ name: 'Customer Alpha', email: 'alpha@test.com' })
      .expect(201);

    const resA = await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);

    expect(resA.body.some((c: any) => c.email === 'alpha@test.com')).toBe(true);

    const resB = await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(200);

    expect(resB.body.some((c: any) => c.email === 'alpha@test.com')).toBe(
      false,
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. Conversations are fully isolated
  // ─────────────────────────────────────────────────────────────────

  it('should not allow Org B to access Org A conversations', async () => {
    // Create a customer + conversation in Org A
    const custRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ name: 'Conv Customer', email: 'conv-cust@test.com' })
      .expect(201);

    const convRes = await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ customerId: custRes.body.id })
      .expect(201);

    const convId = convRes.body.id;

    // Org A can list and see the conversation
    const listA = await request(app.getHttpServer())
      .get('/conversations')
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);

    expect(listA.body.some((c: any) => c.id === convId)).toBe(true);

    // Org B should NOT see Org A's conversation
    const listB = await request(app.getHttpServer())
      .get('/conversations')
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(200);

    expect(listB.body.some((c: any) => c.id === convId)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Tags are fully isolated
  // ─────────────────────────────────────────────────────────────────

  it('should create a tag in Org A and NOT see it in Org B', async () => {
    await request(app.getHttpServer())
      .post('/tags')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ name: 'VIP', type: 'CUSTOMER' })
      .expect(201);

    const tagsA = await request(app.getHttpServer())
      .get('/tags')
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);

    expect(tagsA.body.some((t: any) => t.name === 'VIP')).toBe(true);

    const tagsB = await request(app.getHttpServer())
      .get('/tags')
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(200);

    expect(tagsB.body.some((t: any) => t.name === 'VIP')).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Departments are fully isolated
  // ─────────────────────────────────────────────────────────────────

  it('should create a department in Org A and NOT see it in Org B', async () => {
    await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ name: 'Sales' })
      .expect(201);

    const deptA = await request(app.getHttpServer())
      .get('/departments')
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);

    expect(deptA.body.some((d: any) => d.name === 'Sales')).toBe(true);

    const deptB = await request(app.getHttpServer())
      .get('/departments')
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(200);

    expect(deptB.body.some((d: any) => d.name === 'Sales')).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Staff members are fully isolated
  // ─────────────────────────────────────────────────────────────────

  it('should create a staff member in Org A and NOT see it in Org B', async () => {
    await request(app.getHttpServer())
      .post('/staff')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({
        name: 'Agent One',
        email: 'agent1@orga.com',
        password: 'pass123',
      })
      .expect(201);

    const staffA = await request(app.getHttpServer())
      .get('/staff')
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);

    expect(staffA.body.some((s: any) => s.email === 'agent1@orga.com')).toBe(
      true,
    );

    const staffB = await request(app.getHttpServer())
      .get('/staff')
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(200);

    expect(staffB.body.some((s: any) => s.email === 'agent1@orga.com')).toBe(
      false,
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Prisma extension blocks findUnique under tenant context
  // ─────────────────────────────────────────────────────────────────

  it('should throw when using findUnique under tenant context', async () => {
    await expect(
      TenantContext.run({ orgId: orgA.id, userId: 'test', role: 'ADMIN' }, () =>
        prisma.user.findUnique({ where: { id: 'nonexistent' } }),
      ),
    ).rejects.toThrow(/Tenant isolation/);
  });
});
