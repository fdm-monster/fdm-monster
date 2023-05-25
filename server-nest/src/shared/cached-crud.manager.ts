import { DeepPartial } from "typeorm";
import { Inject, Logger, NotFoundException, Type } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ICrudService } from "@/shared/crud.service";
import { Cache } from "cache-manager";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";

export interface ICacheCrudManager<E, Q, C, U, O> {
  service: ICrudService<E, Q, C, U>;
  mapper: Mapper;
  cacheManager: Cache;

  getCacheKeys(): Promise<string[]>;

  get(id: number, throwError?: boolean): Promise<O>;

  eagerGet(id: number, throwError?: boolean): Promise<O>;

  create(createDto: C): Promise<O>;

  update(id: number, updateDto: U): Promise<O>;

  delete(id: number): Promise<void>;

  list(): Promise<O[]>;
}

export function CacheCrudManager<E, Q, C extends DeepPartial<E>, U extends object, O>(
  cachePrefix: string,
  service: Type<ICrudService<E, Q, C, U>>,
  entity: Type<E>,
  cacheDto: Type<O>,
  ttl = 1000
): Type<ICacheCrudManager<E, Q, C, U, O>> {
  if (!cacheDto) {
    throw new Error(
      `CacheDto argument (3) not provided to ${CacheCrudManager.name} manager service. Cannot proceed mixin construction`
    );
  }

  if (!cachePrefix.length) {
    throw new Error("Cache prefix argument (1) not provided, cannot construct cache manager properly");
  }

  class CachedCrudManagerHost {
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache;
    @InjectMapper() readonly mapper: Mapper;
    @Inject(service) readonly service: ICrudService<E, Q, C, U>;
    private logger = new Logger(CachedCrudManagerHost.name);

    private get prefix() {
      if (cachePrefix?.length) return cachePrefix;

      return this.service.tableName;
    }

    async eagerGet(id: number, throwError: boolean = true) {
      const key = this.constructKey(id);
      const entity = await this.service.get(id, throwError);
      if (!entity && throwError) {
        this.throwNotFound(id);
      } else if (!entity) {
        return;
      }
      return await this.storeMappedEntity(key, entity);
    }

    async get(id: number, throwError: boolean = true) {
      const key = this.constructKey(id);
      const dto = await this.cacheManager.get<O>(key);

      // Hit
      if (dto) {
        return dto;
      }

      // Miss
      return this.eagerGet(id, throwError);
    }

    async list() {
      const cacheEntries = await this.cacheList();
      if (cacheEntries?.length) {
        return cacheEntries;
      }

      const entities = await this.service.list();
      entities.forEach((e) => {
        const key = this.constructKey(this.getEntityId(e));
        this.storeMappedEntity(key, e);
      });
      return await this.cacheList();
    }

    async create(createDto: C) {
      const entity = await this.service.insert(createDto);

      // Infer the primary column name
      const primaryKey = this.service.repository.metadata.primaryColumns[0];
      const id = entity[primaryKey.propertyName];
      return await this.storeMappedEntity(this.constructKey(id), entity);
    }

    async update(id: number, updateDto: U) {
      const key = this.constructKey(id);
      const entity = await this.service.update(id, updateDto);
      return await this.storeMappedEntity(key, entity);
    }

    async delete(id: number) {
      await this.service.delete(id);
      await this.cacheManager.del(this.constructKey(id));
    }

    async getCacheKeys() {
      const cacheKeys = await this.cacheManager.store.keys();

      return cacheKeys.filter((k) => typeof k === "string").filter((k) => k.startsWith(this.prefix));
    }

    public throwNotFound(id: number | string, key = "id") {
      throw new NotFoundException(`Cached entity by ${key} ${id} not found in ${this.service.tableName}`);
    }

    private async cacheList() {
      const keys = await this.getCacheKeys();
      if (!keys.length) return [];

      return (await this.cacheManager.store.mget(...keys)) as O[];
    }

    private getPrimaryColumnProperty() {
      const pkCols = this.service.repository.metadata.primaryColumns;
      if (pkCols?.length > 1) {
        const names = pkCols.map((c) => c.propertyName);
        this.logger.warn(
          `More than 1 primary key columns found, cannot cache entity ${this.service.tableName} with pk cols ${names}`
        );
      }
      return this.service.repository.metadata.primaryColumns[0]?.propertyName;
    }

    private getEntityId(entity): number {
      const pkProp = this.getPrimaryColumnProperty();
      return entity[pkProp];
    }

    private async storeMappedEntity(key: string, entity: E) {
      if (!entity) return;
      const dto = this.map(entity);
      const pkProp = this.getPrimaryColumnProperty();
      this.logger.log(`Cached entity with key ${key} and id ${dto[pkProp]}`);
      await this.cacheManager.set(key, dto, ttl);
      return dto;
    }

    private map(result: E) {
      return this.mapper.map<E, O>(result, entity, cacheDto);
    }

    private constructKey = (id: number) => `${this.prefix}.${id}`;
  }

  return CachedCrudManagerHost;
}
