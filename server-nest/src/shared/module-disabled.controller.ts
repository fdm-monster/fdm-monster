import { Controller, Get, NotFoundException } from "@nestjs/common";

export function GetModuleDisabledController({ path, name, isPlugin }: { path: string; name?: string; isPlugin?: boolean }) {
  @Controller({
    path,
  })
  class ModuleDisabledController {
    @Get("*")
    disabledModule() {
      throw new NotFoundException(`The ${name ? name : path} module is not included with this setup`);
    }

    @Get(!isPlugin ? "module-enabled" : "plugin-enabled")
    moduleEnabled() {
      return {
        moduleEnabled: false,
        moduleName: name || path,
        modulePath: path,
      };
    }
  }

  return ModuleDisabledController;
}
