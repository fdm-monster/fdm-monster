export interface AccessUserResultDto {
  username: string;
  action: "user_logged_out" | "user_deleted" | "user_password_reset" | string;
}
