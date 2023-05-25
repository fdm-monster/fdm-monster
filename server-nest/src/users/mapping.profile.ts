import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import type { Mapper } from "@automapper/core";
import { createMap } from "@automapper/core";
import { Injectable } from "@nestjs/common";
import { User } from "@/users/entities/user.entity";
import { UserDto } from "@/users/dto/user.dto";
import { UserRole } from "@/users/entities/user-role.entity";
import { UserRoleDto } from "@/users/dto/user-role.dto";
import { ProfileDto } from "@/users/dto/profile.dto";

@Injectable()
export class MappingProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(mapper, User, UserDto);
      createMap(mapper, User, ProfileDto);
      createMap(mapper, UserRole, UserRoleDto);
    };
  }
}
