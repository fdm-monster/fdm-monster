import { IBaseService, Type } from "@/services/orm/base.interface";
import { SqliteIdType } from "@/shared.constants";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { DeepPartial, EntityNotFoundError, EntityTarget, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { validate } from "class-validator";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { DEFAULT_PAGE, IPagination } from "@/services/interfaces/page.interface";

export function BaseService<
  T,
  DTO extends object,
  CreateDTO extends object = DeepPartial<T>,
  UpdateDTO extends object = QueryDeepPartialEntity<T>
>(entity: EntityTarget<T>, dto: Type<DTO>, createDTO?: Type<CreateDTO>, updateDto?: Type<UpdateDTO>) {
  abstract class BaseServiceHost implements IBaseService<T, DTO, CreateDTO, UpdateDTO> {
    repository: Repository<T>;

    constructor(protected readonly typeormService: TypeormService) {
      this.repository = typeormService.getDataSource().getRepository(entity);
    }

    abstract toDto(entity: T): DTO;

    async get(id: SqliteIdType, throwIfNotFound = true, options?: FindOneOptions<T>) {
      try {
        if (id === null || id === undefined) {
          throw new EntityNotFoundError(entity, "Id was not provided");
        }
        return this.repository.findOneOrFail({ ...options, where: { id } } as FindOneOptions<T>);
      } catch (e) {
        if (throwIfNotFound && e instanceof EntityNotFoundError) {
          throw new NotFoundException(`The entity ${entity} with the provided id was not found`);
        }
        throw e;
      }
    }

    async list(options?: FindManyOptions<T>) {
      return this.repository.find(options);
    }

    async listPaged(page: IPagination = DEFAULT_PAGE, options?: FindManyOptions<T>) {
      return this.repository.find({ take: page.pageSize, skip: page.pageSize * page.page, ...options });
    }

    async update(id: SqliteIdType, updateDto: UpdateDTO) {
      const entity = await this.get(id);
      await validate(updateDto);
      await validate(Object.assign(entity, updateDto));
      await this.repository.update(entity.id, updateDto);
      return await this.get(id);
    }

    async create(dto: CreateDTO) {
      // Safety mechanism against upserts
      if (dto.id) {
        delete dto.id;
      }
      await validate(dto);
      const entity = this.repository.create(dto) as T;
      await validate(entity);

      return await this.repository.save(entity);
    }

    async delete(id: SqliteIdType, throwIfNotFound?: boolean) {
      const entity = await this.get(id, throwIfNotFound);
      await this.repository.delete(entity.id);
    }

    async deleteMany(ids: SqliteIdType[], emitEvent = true) {
      await this.repository.delete(ids);
    }
  }

  return BaseServiceHost;
}
