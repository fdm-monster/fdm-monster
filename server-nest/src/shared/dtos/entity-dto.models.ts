/**
 * Base model for database entity (with id).
 * Note: this is nice for adding auditing or multi-tenancy
 */

export interface IEntityDto {
  id: number;
}

export interface IFullAuditedEntityDto
  extends IEntityDto,
    IAuditCreationDto,
    IAuditUpdateDto,
    IAuditDeletionDto {}

export interface IAuditCreationDto extends AuditCreatedAt, AuditCreatedBy {}

export interface IAuditUpdateDto extends AuditUpdatedAt, AuditUpdatedBy {}

export interface IAuditDeletionDto extends AuditDeletedAt, AuditDeletedBy {}

export interface AuditDeletedAt {
  deletedAt: string;
}

export interface AuditDeletedBy {
  deletedBy: number;
}

export interface AuditCreatedAt {
  createdAt: string;
}

export interface AuditCreatedBy {
  createdBy: number;
}

export interface AuditUpdatedAt {
  updatedAt: string;
}

export interface AuditUpdatedBy {
  updatedBy: number;
}
