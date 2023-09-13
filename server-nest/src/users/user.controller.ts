import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UpdateUserDto } from "@/users/dto/update-user.dto";
import { CrudController } from "@/shared/crud.controller";
import { User } from "@/users/entities/user.entity";
import { CreateUserDto } from "@/users/dto/create-user.dto";
import { UserDto } from "@/users/dto/user.dto";
import { IdDto } from "@/shared/dtos/id.dto";
import { Roles } from "@/shared/decorators/role.decorator";
import { Role } from "@/users/user.constants";
import { UsersAndRolesDto } from "@/users/dto/users-and-roles.dto";
import { UserRoleCache } from "@/users/user-role.cache";
import { CacheTTL } from "@nestjs/common/cache";

class QueryDto {}

@Controller("user")
@ApiTags("User")
@CacheTTL(1000)
@Roles(Role.Admin)
export class UserController extends CrudController(User, UserService, QueryDto, CreateUserDto, UpdateUserDto, UserDto) {
  readonly service: UserService;

  constructor(private readonly userRoleCache: UserRoleCache) {
    super();
  }

  @Get("users-with-roles")
  async usersWithRoles(): Promise<UsersAndRolesDto> {
    const roleDtos = await this.userRoleCache.list();
    const userDtos = await this.list();
    return {
      users: userDtos,
      roles: roleDtos,
    };
  }

  @Post()
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiCreatedResponse({ type: UserDto })
  async create(@Body() body: CreateUserDto): Promise<UserDto> {
    const userDto = await super.create(body);
    await this.userRoleCache.create({
      userId: userDto.id,
      role: Role.User,
    });
    return userDto;
  }

  @Get(":id/roles")
  @ApiOkResponse({
    type: String,
    isArray: true,
  })
  async getUserRoles(@Param() idDto: IdDto) {
    return await this.userRoleCache.getUserRoles(idDto.id);
  }
}
