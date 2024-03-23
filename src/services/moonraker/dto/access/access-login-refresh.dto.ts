export interface AccessLoginRefreshDto {
  username: string;
  // jwt - valid 1 hour
  token: string;
  action: "user_jwt_refresh" | string;
  source: "moonraker" | "ldap" | string;
}
