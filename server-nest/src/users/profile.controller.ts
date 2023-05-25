import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserRoleService } from "@/users/user-role.service";
import { ProfileDto } from "@/users/dto/profile.dto";
import { CurrentUser } from "@/shared/decorators/current-user.decorator";
import { BaseController } from "@/shared/base.controller";
import { User } from "@/users/entities/user.entity";

@Controller("profile")
@ApiTags("Profile")
export class ProfileController extends BaseController() {
  constructor(private userRoleService: UserRoleService) {
    super();
  }

  @Get()
  @ApiOkResponse({
    type: ProfileDto,
    isArray: true,
  })
  async getProfile(@CurrentUser() user: User) {
    const profileDto = await this.mapper.map(user, User, ProfileDto);
    profileDto.roles = await this.userRoleService.getUserRoles(user.id);
    return profileDto;
  }
}
