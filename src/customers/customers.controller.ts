import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async createCustomer(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(currentUser, dto);
  }

  @Get()
  async listCustomers(@CurrentUser() currentUser: JwtPayload) {
    return this.customersService.listCustomers(currentUser);
  }

  @Get(':id')
  async getCustomer(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.getCustomerById(currentUser, id);
  }

  @Patch(':id')
  async updateCustomer(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(currentUser, id, dto);
  }

  @Get(':id/note')
  async getCustomerNote(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.getCustomerNote(currentUser, id);
  }

  @Patch(':id/note')
  async upsertCustomerNote(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.customersService.upsertCustomerNote(
      currentUser,
      id,
      body.content ?? '',
    );
  }

  @Get(':id/tags')
  async getCustomerTags(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.getCustomerTags(currentUser, id);
  }

  @Post(':id/tags')
  async addCustomerTag(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: { tagId: string },
  ) {
    return this.customersService.addCustomerTag(currentUser, id, body.tagId);
  }

  @Delete(':id/tags/:tagId')
  async removeCustomerTag(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.customersService.removeCustomerTag(currentUser, id, tagId);
  }
}
