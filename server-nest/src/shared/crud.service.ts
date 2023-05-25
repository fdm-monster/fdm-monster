import { Type } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { IReadonlyCrudService, ReadonlyCrudService } from "@/shared/readonly-crud.service";

export interface ICrudService<E, Q, C, U> extends IReadonlyCrudService<E, Q> {
  delete(id: number): Promise<void>;

  insert(input: C): Promise<E>;

  update(id: number, input: U, throwError?: boolean): Promise<E>;
}

// MixIn from https://github.com/nestjs/typeorm/issues/187
export function CrudService<E, Q, C extends DeepPartial<E>, U extends object>(entity: Type<E>): Type<ICrudService<E, Q, C, U>> {
  class CrudServiceHost extends ReadonlyCrudService(entity) implements ICrudService<E, Q, C, U> {
    @InjectRepository(entity) public readonly repository: Repository<E>;

    public async insert(input: C) {
      const createdEntity = this.repository.create(input);
      const result = await this.repository.insert(createdEntity as any);
      return await this.get(result.identifiers[0].id);
    }

    public async update(id: number, input: U, throwError = true) {
      await this.get(id, throwError);
      await this.repository.update(id, input);
      return await this.get(id, throwError);
    }

    public async delete(id: number) {
      await this.get(id);
      await this.repository.delete(id);
    }
  }

  return CrudServiceHost;
}
