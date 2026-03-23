import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCustomer(currentUser: JwtPayload, dto: CreateCustomerDto): Promise<{
        id: string;
        orgId: string;
        name: string | null;
        email: string | null;
        createdAt: Date;
        phone: string | null;
        externalId: string | null;
        source: import("@prisma/client").$Enums.Channel | null;
        pageId: string | null;
        isSaved: boolean;
    }>;
    listCustomers(currentUser: JwtPayload): Promise<{
        id: string;
        orgId: string;
        name: string | null;
        email: string | null;
        createdAt: Date;
        phone: string | null;
        externalId: string | null;
        source: import("@prisma/client").$Enums.Channel | null;
        pageId: string | null;
        isSaved: boolean;
    }[]>;
    getCustomerById(currentUser: JwtPayload, customerId: string): Promise<{
        id: string;
        orgId: string;
        name: string | null;
        email: string | null;
        createdAt: Date;
        phone: string | null;
        externalId: string | null;
        source: import("@prisma/client").$Enums.Channel | null;
        pageId: string | null;
        isSaved: boolean;
    }>;
    updateCustomer(currentUser: JwtPayload, customerId: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        orgId: string;
        name: string | null;
        email: string | null;
        createdAt: Date;
        phone: string | null;
        externalId: string | null;
        source: import("@prisma/client").$Enums.Channel | null;
        pageId: string | null;
        isSaved: boolean;
    }>;
    getCustomerNote(currentUser: JwtPayload, customerId: string): Promise<{
        content: string;
    }>;
    upsertCustomerNote(currentUser: JwtPayload, customerId: string, content: string): Promise<{
        content: string;
    }>;
    getCustomerTags(currentUser: JwtPayload, customerId: string): Promise<any[]>;
    addCustomerTag(currentUser: JwtPayload, customerId: string, tagId: string): Promise<any[]>;
    removeCustomerTag(currentUser: JwtPayload, customerId: string, tagId: string): Promise<any[]>;
}
