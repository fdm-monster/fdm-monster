import { FullAuditedEntityDto } from "@/shared/dtos/entity.dtos";
import { AutoMap } from "@automapper/classes";

export class UserRoleDto extends FullAuditedEntityDto {
  @AutoMap()
  id: number;
  @AutoMap()
  role: string;
  @AutoMap()
  userId: number;
}
