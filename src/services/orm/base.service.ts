import { Type, type IBaseService } from "@/services/orm/base.interface";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { DeepPartial, EntityNotFoundError, EntityTarget, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { validate } from "class-validator";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { DEFAULT_PAGE, type IPagination } from "@/services/interfaces/page.interface";

export function BaseService<
  T extends { id: number },
  DTO extends object,
  CreateDTO extends DeepPartial<T> = DeepPartial<T>,
  UpdateDTO extends object = QueryDeepPartialEntity<T>,
>(entity: EntityTarget<T>, dto: Type<DTO>, createDTO?: Type<CreateDTO>, updateDto?: Type<UpdateDTO>) {
  abstract class BaseServiceHost implements IBaseService<T, DTO, CreateDTO, UpdateDTO> {
    repository: Repository<T>;

    constructor(protected readonly typeormService: TypeormService) {
      this.repository = typeormService.getDataSource().getRepository(entity);
    }

    abstract toDto(entity: T): DTO;

    async get(id: number, options?: FindOneOptions<T>) {
      try {
        if (id === null || id === undefined) {
          throw new EntityNotFoundError(entity, "Id was not provided");
        }
        return this.repository.findOneOrFail({ ...options, where: { id } } as FindOneOptions<T>);
      } catch (e) {
        if (e instanceof EntityNotFoundError) {
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

    async update(id: number, updateDto: UpdateDTO) {
      const entity = await this.get(id);
      await validate(updateDto);
      await validate(Object.assign(entity, updateDto));
      await this.repository.update(entity.id, updateDto);
      return await this.get(id);
    }

    async create(dto: CreateDTO) {
      // Explicit runtime check with a meaningful error
      if ("id" in dto && dto.id !== undefined && dto.id !== null) {
        throw new Error("Cannot create entity with an existing ID. Use update method instead.");
      }

      const entity = this.repository.create(dto) as T;
      await validate(entity);

      return await this.repository.save(entity);
    }

    async delete(id: number) {
      const entity = await this.get(id);
      await this.repository.delete(entity.id);
    }

    async deleteMany(ids: number[]) {
      await this.repository.delete(ids);
    }
  }

  return BaseServiceHost;
}
