import { DeepPartial, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { SqliteIdType } from "@/shared.constants";
import { IPagination } from "@/services/interfaces/page.interface";

export interface IBaseService<
  T extends object,
  DTO extends object,
  CreateDTO extends object = DeepPartial<T>,
  UpdateDTO extends object = DTO,
> {
  repository: Repository<T>;

  toDto(entity: T): DTO;

  list(options?: FindManyOptions<T>): Promise<T[]>;

  listPaged(page: IPagination): Promise<T[]>;

  get(id: SqliteIdType, options?: FindOneOptions<T>): Promise<T>;

  create(dto: CreateDTO): Promise<T>;

  update(id: SqliteIdType, dto: UpdateDTO): Promise<T>;

  delete(id: SqliteIdType): Promise<void>;

  deleteMany(ids: SqliteIdType[], emitEvent: boolean): Promise<void>;
}

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}
