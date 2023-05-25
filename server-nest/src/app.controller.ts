import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@/users/user.constants";
import { Roles } from "@/shared/decorators/role.decorator";

@Controller("app")
@ApiTags("App")
@Roles(Role.Admin)
export class AppController {
  constructor() {}
}
