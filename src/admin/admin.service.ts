import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        isOnboarded: true,
        subscriptionPlan: true,
        _count: {
          select: {
            users: true,
            departments: true,
            customers: true,
            conversations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      isOnboarded: org.isOnboarded,
      subscriptionPlan: org.subscriptionPlan,
      staffCount: org._count.users,
      departmentCount: org._count.departments,
      customerCount: org._count.customers,
      conversationCount: org._count.conversations,
    }));
  }

  async deleteOrganization(id: string) {
    // Delete all related data in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete messages
      await tx.message.deleteMany({
        where: { orgId: id },
      });

      // Delete conversation tags
      await tx.conversationTag.deleteMany({
        where: { orgId: id },
      });

      // Delete conversation notes
      await tx.conversationNote.deleteMany({
        where: { orgId: id },
      });

      // Delete conversations
      await tx.conversation.deleteMany({
        where: { orgId: id },
      });

      // Delete customer tags
      await tx.customerTag.deleteMany({
        where: { orgId: id },
      });

      // Delete customer notes
      await tx.customerNote.deleteMany({
        where: { orgId: id },
      });

      // Delete customers
      await tx.customer.deleteMany({
        where: { orgId: id },
      });

      // Delete saved replies
      await tx.savedReply.deleteMany({
        where: { orgId: id },
      });

      // Delete auto replies
      await tx.autoReply.deleteMany({
        where: { orgId: id },
      });

      // Delete routing settings
      await tx.routingSettings.deleteMany({
        where: { orgId: id },
      });

      // Delete tags
      await tx.tag.deleteMany({
        where: { orgId: id },
      });

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { orgId: id },
      });

      // Delete auth codes
      await tx.authCode.deleteMany({
        where: { createdAt: undefined }, // AuthCode doesn't have orgId, so we skip it
      });

      // Delete social accounts
      await tx.socialAccount.deleteMany({
        where: { orgId: id },
      });

      // Delete departments
      await tx.department.deleteMany({
        where: { orgId: id },
      });

      // Delete users
      await tx.user.deleteMany({
        where: { orgId: id },
      });

      // Finally delete the organization
      await tx.organization.delete({
        where: { id },
      });
    });

    return { success: true };
  }
}
