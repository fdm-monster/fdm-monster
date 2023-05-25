import { Global, Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { AutomapperModule } from "@automapper/nestjs";
import { classes } from "@automapper/classes";

@Global()
@Module({
  imports: [
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 10 * 1000, // default 10 seconds
    }),
  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class CoreModule {}
