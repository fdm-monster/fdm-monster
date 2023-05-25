import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Settings } from "./entities/settings.entity";
import { SettingsService } from "@/settings/settings.service";
import { SettingsController } from "@/settings/settings.controller";
import { MappingProfile } from "@/settings/mapping.profile";
import { SettingsCache } from "@/settings/settings.cache";

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  providers: [SettingsService, SettingsCache, MappingProfile],
  exports: [SettingsCache],
  controllers: [SettingsController],
})
export class SettingsModule {}
