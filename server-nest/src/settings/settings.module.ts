import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServerSettings } from "./entities/server-settings.entity";
import { ClientSettingsService } from "./services/client-settings.service";
import { ServerSettingsService } from "./services/server-settings.service";
import { ServerSettingsCacheService } from "./services/server-settings-cache.service";

@Module({
  imports: [TypeOrmModule.forFeature([ServerSettings])],
  providers: [ServerSettingsService, ServerSettingsCacheService, ClientSettingsService],
  exports: [ServerSettingsService, ServerSettingsCacheService, ClientSettingsService]
})
export class SettingsModule {}
