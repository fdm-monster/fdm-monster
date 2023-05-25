import { Type } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";

export interface IBaseController {
  mapper: Mapper;
}

/**
 * https://stackoverflow.com/questions/55818694/usepipesvalidationpipe-not-working-with-generics-abstract-controller/64802874#64802874
 * https://stackoverflow.com/questions/71394797/nestjs-reusable-controller-with-validation
 * @constructor
 */
export function BaseController(): Type<IBaseController> {
  class BaseControllerHost implements IBaseController {
    @InjectMapper() public mapper: Mapper;
  }

  return BaseControllerHost;
}
