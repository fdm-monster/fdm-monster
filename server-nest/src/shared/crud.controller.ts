import { Body, Delete, Inject, Param, Patch, Post, Type, UsePipes } from "@nestjs/common";
import { ICrudService } from "@/shared/crud.service";
import { IdDto } from "@/shared/dtos/id.dto";
import { IReadonlyCrudController, ReadonlyCrudController } from "@/shared/readonly-crud.controller";
import { ApiBody, ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { AbstractValidationPipe } from "@/shared/abstract-validation.pipe";

export interface ICrudController<E, Q, C, U, O> extends IReadonlyCrudController<E, Q, O> {
  create(body: C): Promise<O>;

  delete(params: IdDto): Promise<void>;

  update(params: IdDto, body: U): Promise<O>;
}

/**
 * https://stackoverflow.com/questions/55818694/usepipesvalidationpipe-not-working-with-generics-abstract-controller/64802874#64802874
 * https://stackoverflow.com/questions/71394797/nestjs-reusable-controller-with-validation
 * @param entity
 * @param service
 * @param createDto
 * @param updateDto
 * @param queryDto
 * @param outputDto
 * @constructor
 */
export function CrudController<E, Q, C, U, O>(
  entity: Type<E>,
  service: Type<ICrudService<E, Q, C, U>>,
  queryDto: Type<Q>,
  createDto: Type<C>,
  updateDto: Type<U>,
  outputDto: Type<O>
): Type<ICrudController<E, Q, C, U, O>> {
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

  class CrudController
    extends ReadonlyCrudController<E, Q, O>(entity, service, queryDto, outputDto)
    implements ICrudController<E, Q, C, U, O>
  {
    @Inject(service) service: ICrudService<E, Q, C, U>;

    @Post()
    @UsePipes(createPipe)
    @ApiBody({
      type: createDto,
    })
    @ApiCreatedResponse({ type: outputDto })
    async create(@Body() body: C): Promise<O> {
      const result = await this.service.insert(body);
      return this.map(result);
    }

    @Delete(":id")
    @ApiOkResponse()
    async delete(@Param() params: IdDto) {
      return this.service.delete(params.id);
    }

    @Patch(":id")
    @UsePipes(updatePipe)
    @ApiOkResponse({
      type: outputDto,
    })
    @ApiBody({
      type: updateDto,
    })
    async update(@Param() params: IdDto, @Body() body: U) {
      const result = await this.service.update(params.id, body);
      return this.map(result);
    }
  }

  return CrudController;
}
