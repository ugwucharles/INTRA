import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Channel, ConversationStatus, SenderType } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'INTRA API Online';
  }

  @Get('setup-visuals')
  async setupVisuals() {
    const admin = await this.prisma.user.findFirst({
      where: { email: 'visuals.dummy@intrabox.com' },
    });
    if (!admin) return { error: 'Admin not found' };

    // Update Admin
    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        title: 'Head of Support',
      },
    });

    const orgId = admin.orgId;

    // Create a customer if not exists
    let customer1 = await this.prisma.customer.findFirst({ where: { email: 'john@example.com', orgId } });
    if (!customer1) {
      customer1 = await this.prisma.customer.create({
        data: { orgId, name: 'John Doe', email: 'john@example.com', source: Channel.WHATSAPP },
      });
    }

    // Create a conversation
    const conv = await this.prisma.conversation.create({
      data: {
        orgId,
        customerId: customer1.id,
        status: ConversationStatus.OPEN,
        assignedTo: admin.id,
        messages: {
          create: [
            { senderType: SenderType.CUSTOMER, content: 'Where is my order #12345?' },
            { senderType: SenderType.STAFF, senderId: admin.id, content: 'Checking that for you right now, John!' },
          ]
        }
      }
    });

    // Update with firstResponseTime (safe update)
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { firstResponseTime: 45 } as any,
    });

    return { status: 'success', orgId };
  }
}
