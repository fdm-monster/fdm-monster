import { AwilixContainer } from "awilix";
import { RoleName } from "@/constants/authorization.constants";
import { UserDto } from "@/services/interfaces/user.dto";

declare module "express" {
  interface Request {
    local?: any;
    user?: UserDto;
    container: AwilixContainer;
    roles?: RoleName[];
  }
}
