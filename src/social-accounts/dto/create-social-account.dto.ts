import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Channel } from '@prisma/client';

export class CreateSocialAccountDto {
  @IsEnum(Channel)
  channel: Channel;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  pageId?: string;

  @IsOptional()
  @IsString()
  appSecret?: string;

  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
