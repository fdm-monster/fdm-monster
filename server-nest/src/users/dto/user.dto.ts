import { AuditCreationDto } from "@/shared/dtos/entity.dtos";
import { AutoMap } from "@automapper/classes";

export class UserDto extends AuditCreationDto {
  @AutoMap()
  id: number;
  @AutoMap()
  username: string;
}
