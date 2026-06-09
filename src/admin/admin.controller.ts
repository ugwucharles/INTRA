import {
  Controller,
  Get,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { SuperAdminGuard } from './super-admin.guard';

@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('organizations')
  async getAllOrganizations() {
    return this.adminService.getAllOrganizations();
  }

  @Delete('organizations/:id')
  @HttpCode(HttpStatus.OK)
  async deleteOrganization(@Param('id') id: string) {
    return this.adminService.deleteOrganization(id);
  }
}
