import { Channel } from '@prisma/client';
export declare class CreateSocialAccountDto {
    channel: Channel;
    accessToken: string;
    displayName?: string;
    pageId?: string;
    appSecret?: string;
    phoneNumberId?: string;
    isActive?: boolean;
}
