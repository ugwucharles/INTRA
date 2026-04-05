import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(currentUser: JwtPayload, dto: CreateCustomerDto) {
    const { name, email, phone } = dto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const customer = await this.prisma.customer.create({
      data: {
        orgId: currentUser.orgId,
        name: name ?? null,
        email: email ?? null,
        phone: phone ?? null,
        // Manually created customers are explicitly saved contacts.
        isSaved: true,
      },
    });

    return customer;
  }

  async listCustomers(currentUser: JwtPayload) {
    return this.prisma.customer.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomerById(currentUser: JwtPayload, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    return customer;
  }

  async updateCustomer(
    currentUser: JwtPayload,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;

    // Any manual update via the API is treated as explicitly saving this contact.
    data.isSaved = true;

    await this.prisma.customer.updateMany({
      where: { id: customer.id, orgId: currentUser.orgId },
      data,
    });

    const updated = await this.prisma.customer.findFirst({
      where: { id: customer.id, orgId: currentUser.orgId },
    });

    if (!updated) {
      throw new NotFoundException('Customer not found in this organization');
    }

    return updated;
  }

  async getCustomerNote(currentUser: JwtPayload, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const note = await this.prisma.customerNote.findFirst({
      where: {
        orgId: currentUser.orgId,
        customerId: customer.id,
        userId: currentUser.userId,
      },
    });

    return { content: note?.content ?? '' };
  }

  async upsertCustomerNote(
    currentUser: JwtPayload,
    customerId: string,
    content: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    // Use findFirst + create/updateMany instead of upsert to stay tenant-safe
    const existingNote = await this.prisma.customerNote.findFirst({
      where: {
        customerId: customer.id,
        userId: currentUser.userId,
        orgId: currentUser.orgId,
      },
    });

    let note;
    if (existingNote) {
      await this.prisma.customerNote.updateMany({
        where: { id: existingNote.id, orgId: currentUser.orgId },
        data: { content },
      });
      note = await this.prisma.customerNote.findFirst({
        where: { id: existingNote.id, orgId: currentUser.orgId },
      });
    } else {
      note = await this.prisma.customerNote.create({
        data: {
          orgId: currentUser.orgId,
          customerId: customer.id,
          userId: currentUser.userId,
          content,
        },
      });
    }

    return { content: note?.content ?? '' };
  }

  async getCustomerTags(currentUser: JwtPayload, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const tags = await this.prisma.customerTag.findMany({
      where: { customerId: customer.id },
      include: { tag: true },
    });

    return tags.map((ct: any) => ct.tag);
  }

  async addCustomerTag(
    currentUser: JwtPayload,
    customerId: string,
    tagId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, orgId: currentUser.orgId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found in this organization');
    }

    // Use findFirst + create instead of upsert to stay tenant-safe
    const existingLink = await this.prisma.customerTag.findFirst({
      where: {
        customerId: customer.id,
        tagId: tag.id,
        orgId: currentUser.orgId,
      },
    });
    if (!existingLink) {
      await this.prisma.customerTag.create({
        data: {
          orgId: currentUser.orgId,
          customerId: customer.id,
          tagId: tag.id,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CUSTOMER_TAG_ADDED',
        targetId: customer.id,
        targetType: 'customer',
      },
    });

    return this.getCustomerTags(currentUser, customer.id);
  }

  async removeCustomerTag(
    currentUser: JwtPayload,
    customerId: string,
    tagId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    await this.prisma.customerTag.deleteMany({
      where: {
        customerId: customer.id,
        tagId,
        orgId: currentUser.orgId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CUSTOMER_TAG_REMOVED',
        targetId: customer.id,
        targetType: 'customer',
      },
    });

    return this.getCustomerTags(currentUser, customer.id);
  }
}
