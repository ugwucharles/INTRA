export class RegisterAdminDto {
  organizationName!: string;
  name!: string;
  email!: string;
  password!: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}
