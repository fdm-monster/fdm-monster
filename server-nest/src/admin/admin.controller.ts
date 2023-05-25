import { Controller, Get, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ApiTags } from "@nestjs/swagger";

@Controller({
  path: "admin",
  version: "1",
})
@ApiTags("Admin")
export class AdminController {
  @Inject(CACHE_MANAGER) cacheManager: Cache;

  @Get()
  cacheKeys() {
    return this.cacheManager.store.keys();
  }
}
