import { AwilixContainer } from "awilix";
import type { RoleName } from "@/constants/authorization.constants";
import type { UserDto } from "@/services/interfaces/user.dto";

declare module "express" {
  interface Request {
    local?: any;
    user?: UserDto;
    container: AwilixContainer;
    roles?: RoleName[];
  }
}
