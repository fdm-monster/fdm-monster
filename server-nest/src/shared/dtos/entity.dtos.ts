import { AutoMap } from '@automapper/classes';
import {
  IAuditCreationDto,
  IAuditDeletionDto,
  IAuditUpdateDto,
  IEntityDto,
  IFullAuditedEntityDto,
} from '@/shared/dtos/entity-dto.models';

export class EntityDto implements IEntityDto {
  @AutoMap()
  id: number;
}

export class FullAuditedEntityDto
  extends EntityDto
  implements IFullAuditedEntityDto
{
  @AutoMap()
  createdAt: string;
  @AutoMap()
  createdBy: number | null;
  @AutoMap()
  deletedAt: string | null;
  @AutoMap()
  deletedBy: number | null;
  @AutoMap()
  updatedAt: string | null;
  @AutoMap()
  updatedBy: number | null;
}

export class AuditCreationDto extends EntityDto implements IAuditCreationDto {
  @AutoMap()
  createdAt: string;
  @AutoMap()
  createdBy: number | null;
}

export class AuditUpdateDto extends EntityDto implements IAuditUpdateDto {
  @AutoMap()
  updatedAt: string | null;
  @AutoMap()
  updatedBy: number | null;
}

export class AuditDeletionDto extends EntityDto implements IAuditDeletionDto {
  @AutoMap()
  deletedAt: string | null;
  @AutoMap()
  deletedBy: number | null;
}
