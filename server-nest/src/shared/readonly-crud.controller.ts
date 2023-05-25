import { Get, Inject, Param, Type } from "@nestjs/common";
import { IdDto } from "@/shared/dtos/id.dto";
import { IReadonlyCrudService } from "@/shared/readonly-crud.service";
import { Mapper } from "@automapper/core";
import { AbstractValidationPipe } from "@/shared/abstract-validation.pipe";
import { ApiOkResponse } from "@nestjs/swagger";
import { BaseController } from "@/shared/base.controller";

export interface IReadonlyCrudController<E, Q, O> {
  service: IReadonlyCrudService<E, Q>;
  mapper: Mapper;

  list(): Promise<O[]>;

  get(params: IdDto): Promise<O>;

  mapArray(result: E[]): O[];

  map(result: E): O;
}

/**
 * https://stackoverflow.com/questions/55818694/usepipesvalidationpipe-not-working-with-generics-abstract-controller/64802874#64802874
 * https://stackoverflow.com/questions/71394797/nestjs-reusable-controller-with-validation
 * @param entity
 * @param service
 * @param queryDto
 * @param outputDto
 * @constructor
 */
export function ReadonlyCrudController<E, Q, O>(
  entity: Type<E>,
  service: Type<IReadonlyCrudService<E, Q>>,
  queryDto: Type<Q>,
  outputDto: Type<O>
): Type<IReadonlyCrudController<E, Q, O>> {
  const queryPipe = new AbstractValidationPipe({ whitelist: true, transform: true }, { query: queryDto });

  class ReadonlyCrudController extends BaseController() implements IReadonlyCrudController<E, Q, O> {
    @Inject(service) public service: IReadonlyCrudService<E, Q>;

    @Get(":id")
    @ApiOkResponse({
      type: outputDto,
    })
    async get(@Param() params: IdDto): Promise<O> {
      const result = await this.service.get(params.id);
      return this.map(result);
    }

    @Get()
    // @UsePipes(queryPipe)
    @ApiOkResponse({
      type: outputDto,
      isArray: true,
    })
    async list() {
      const result = await this.service.list();
      return this.mapArray(result);
    }

    mapArray(result: E[]) {
      return this.mapper.mapArray<E, O>(result, entity, outputDto);
    }

    map(result: E) {
      return this.mapper.map<E, O>(result, entity, outputDto);
    }
  }

  return ReadonlyCrudController;
}
