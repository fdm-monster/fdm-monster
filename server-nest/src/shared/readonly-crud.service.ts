import { NotFoundException, Type } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

export interface IReadonlyCrudService<E, Q> {
  readonly repository: Repository<E>;
  readonly tableName: string;

  get(id: number, throwError?: boolean): Promise<E>;

  list(): Promise<E[]>;

  count(): Promise<[E[], number]>;

  throwNotFound(id: number | string, key: string): void;
}

// MixIn from https://github.com/nestjs/typeorm/issues/187
export function ReadonlyCrudService<E, Q>(entity: Type<E>): Type<IReadonlyCrudService<E, Q>> {
  class ReadonlyCrudServiceHost implements IReadonlyCrudService<E, Q> {
    @InjectRepository(entity) public readonly repository: Repository<E>;

    get tableName(): string {
      return this.repository.metadata.tableName;
    }

    public async count() {
      return this.repository.findAndCount();
    }

    public async list() {
      return this.repository.find({});
    }

    public async get(id: number, throwError = true) {
      const result = await this.repository.findOneById(id);

      if (!result && throwError) {
        this.throwNotFound(id);
      }

      return result;
    }

    public throwNotFound(id: number | string, key = "id") {
      throw new NotFoundException(`Entity by ${key} ${id} not found in ${this.tableName}`);
    }
  }

  return ReadonlyCrudServiceHost;
}
