import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

class CreateDepartmentDto {
  name!: string;
}

class UpdateDepartmentDto {
  name?: string;
  isActive?: boolean;
}

class UpdateDepartmentMembersDto {
  userIds!: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async list(@CurrentUser() currentUser: JwtPayload) {
    return this.departmentsService.listDepartments(currentUser);
  }

  @Post()
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentsService.createDepartment(currentUser, dto.name);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(currentUser, id, dto);
  }

  @Patch(':id/members')
  async setMembers(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentMembersDto,
  ) {
    return this.departmentsService.setMembers(
      currentUser,
      id,
      dto.userIds ?? [],
    );
  }

  @Delete(':id')
  async deleteDepartment(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.departmentsService.deleteDepartment(currentUser, id);
  }
}
