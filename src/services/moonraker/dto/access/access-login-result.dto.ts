export interface AccessLoginResultDto {
  username: string;
  // jwt - valid 1 hour
  token: string;
  // jwt
  refresh_token: string;
  action: "user_logged_in" | "user_created" | string;
  source: "moonraker" | "ldap" | string;
}
