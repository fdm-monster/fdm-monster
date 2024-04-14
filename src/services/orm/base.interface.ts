import { DeepPartial, DeleteResult, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { SqliteIdType } from "@/shared.constants";
import { IPagination } from "@/services/interfaces/page.interface";

export interface IBaseService<
  T extends object,
  DTO extends object,
  CreateDTO extends object = DeepPartial<T>,
  UpdateDTO extends object = DTO
> {
  repository: Repository<T>;
  typeormService: TypeormService;

  toDto(entity: T): DTO;

  list(options?: FindManyOptions<T>): Promise<T[]>;

  listPaged(page: IPagination): Promise<T[]>;

  get(id: SqliteIdType, throwIfNotFound?: boolean, options?: FindOneOptions<T>): Promise<T | null>;

  create(dto: CreateDTO): Promise<T>;

  update(id: SqliteIdType, dto: UpdateDTO): Promise<T>;

  delete(id: SqliteIdType): Promise<DeleteResult>;

  deleteMany(ids: SqliteIdType[], emitEvent: boolean): Promise<DeleteResult>;
}

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}
