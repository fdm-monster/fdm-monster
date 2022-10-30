import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrintersModule } from "./printers/printers.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { APP_FILTER } from "@nestjs/core";
import { ExceptionsLoggerFilter } from "./services/exceptions-logger.filter";
import { ApiModule } from "./api/api.module";
import { BootController } from "./boot/boot.controller";
import { SettingsModule } from "./settings/settings.module";
import { OctoprintModule } from "./octoprint/octoprint.module";
import { ScheduleModule } from "@nestjs/schedule";
import { CoreModule } from "@/core/core.module";
import { DataSource } from "typeorm";
import { TypeOrmConfigService } from "@/services/typeorm-config.service";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionsLoggerFilter
    }
  ],
  imports: [
    CoreModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => {
        return await new DataSource(options).initialize();
      }
    }),
    ApiModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    PrintersModule,
    OctoprintModule
  ],
  controllers: [BootController]
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);
}
