export class UpdateStaffDto {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'AGENT';
  password?: string;
  isActive?: boolean;
}
