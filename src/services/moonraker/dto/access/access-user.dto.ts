export interface AccessUserDto {
  username: string;
  source: "moonraker" | "ldap" | string;
  created_on: number;
}
