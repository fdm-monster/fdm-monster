import type { UserDto } from "@/services/octoprint/dto/access/user.dto";

export interface OP_LoginDto extends UserDto {
  _is_external_client: boolean;
  _login_mechanism: string;
  session: string;
}
