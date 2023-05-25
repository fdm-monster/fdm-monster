import { FullAuditedEntityDto } from "@/shared/dtos/entity.dtos";
import { AutoMap } from "@automapper/classes";

export class ProfileDto extends FullAuditedEntityDto {
  @AutoMap()
  id: number;
  @AutoMap()
  username: string;

  roles: string[];
}
