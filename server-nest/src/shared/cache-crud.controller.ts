import { Body, Delete, Get, Inject, Param, Patch, Post, Type, UsePipes } from "@nestjs/common";
import { IdDto } from "@/shared/dtos/id.dto";
import { ApiBody, ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { Mapper } from "@automapper/core";
import { AbstractValidationPipe } from "@/shared/abstract-validation.pipe";
import { ICacheCrudManager } from "@/shared/cached-crud.manager";
import { BaseController } from "@/shared/base.controller";

export interface ICacheCrudController<E, Q, C, U, O> {
  cache: ICacheCrudManager<E, Q, C, U, O>;
  mapper: Mapper;

  create(body: C): Promise<O>;

  delete(params: IdDto): Promise<void>;

  update(params: IdDto, body: U): Promise<O>;

  list(): Promise<O[]>;

  count(): Promise<number>;

  get(params: IdDto): Promise<O>;

  mapArray(result: E[]): O[];

  map(result: E): O;
}

/**
 * https://stackoverflow.com/questions/55818694/usepipesvalidationpipe-not-working-with-generics-abstract-controller/64802874#64802874
 * https://stackoverflow.com/questions/71394797/nestjs-reusable-controller-with-validation
 * @param entity
 * @param cache
 * @param createDto
 * @param updateDto
 * @param queryDto
 * @param outputDto
 * @constructor
 */
export function CacheCrudController<E, Q, C, U, O>(
  entity: Type<E>,
  cache: Type<ICacheCrudManager<E, Q, C, U, O>>,
  queryDto: Type<Q>,
  createDto: Type<C>,
  updateDto: Type<U>,
  outputDto: Type<O>
): Type<ICacheCrudController<E, Q, C, U, O>> {
  const createPipe = new AbstractValidationPipe(
    { whitelist: true, forbidNonWhitelisted: true, enableDebugMessages: true },
    { body: createDto }
  );
  const updatePipe = new AbstractValidationPipe(
    { whitelist: true, forbidNonWhitelisted: true, enableDebugMessages: true },
    { body: updateDto }
  );
  const queryPipe = new AbstractValidationPipe(
    { whitelist: true, forbidNonWhitelisted: true, enableDebugMessages: true },
    { query: queryDto }
  );

  class CacheCrudControllerHost extends BaseController() implements ICacheCrudController<E, Q, C, U, O> {
    @Inject(cache) cache: ICacheCrudManager<E, Q, C, U, O>;

    @Get(":id")
    @ApiOkResponse({
      type: outputDto,
    })
    async get(@Param() params: IdDto): Promise<O> {
      return await this.cache.get(params.id);
    }

    @Get()
    // @UsePipes(queryPipe)
    @ApiOkResponse({
      type: outputDto,
      isArray: true,
    })
    async list() {
      return await this.cache.list();
    }

    async count() {
      return (await this.cache.list()).length;
    }

    @Post()
    @UsePipes(createPipe)
    @ApiBody({
      type: createDto,
    })
    @ApiCreatedResponse({ type: outputDto })
    async create(@Body() body: C): Promise<O> {
      return await this.cache.create(body);
    }

    @Delete(":id")
    @ApiOkResponse()
    delete(@Param() params: IdDto) {
      return this.cache.delete(params.id);
    }

    @Patch(":id")
    @UsePipes(updatePipe)
    @ApiOkResponse({
      type: outputDto,
    })
    @ApiBody({
      type: updateDto,
    })
    update(@Param() params: IdDto, @Body() body: U) {
      return this.cache.update(params.id, body);
    }

    mapArray(result: E[]) {
      return this.mapper.mapArray<E, O>(result, entity, outputDto);
    }

    map(result: E) {
      return this.mapper.map<E, O>(result, entity, outputDto);
    }
  }

  return CacheCrudControllerHost;
}
