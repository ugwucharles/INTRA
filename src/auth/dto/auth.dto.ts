export class RegisterAdminDto {
  organizationName!: string;
  name!: string;
  email!: string;
  password!: string;
  country!: string;
  phone!: string;
  address?: string;
}

export class OnboardDto {
  organizationName!: string;
  country!: string;
  phone!: string;
  address?: string;
}

export class LoginDto {
  email!: string;
  password!: string;
  /**
   * Optional orgId to disambiguate logins when the same email exists in multiple orgs.
   */
  orgId?: string;
}
