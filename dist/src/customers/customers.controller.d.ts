import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
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
    getCustomer(currentUser: JwtPayload, id: string): Promise<{
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
    updateCustomer(currentUser: JwtPayload, id: string, dto: UpdateCustomerDto): Promise<{
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
    getCustomerNote(currentUser: JwtPayload, id: string): Promise<{
        content: string;
    }>;
    upsertCustomerNote(currentUser: JwtPayload, id: string, body: {
        content: string;
    }): Promise<{
        content: string;
    }>;
    getCustomerTags(currentUser: JwtPayload, id: string): Promise<any[]>;
    addCustomerTag(currentUser: JwtPayload, id: string, body: {
        tagId: string;
    }): Promise<any[]>;
    removeCustomerTag(currentUser: JwtPayload, id: string, tagId: string): Promise<any[]>;
}
