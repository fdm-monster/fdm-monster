import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { ServerSetting } from "@/settings/models/server-setting.model";
import { clientSettingsKey, fileCleanSettingsKey, serverSettingsKey } from "@/settings/settings.constants";
import { FileCleanSettings } from "@/settings/models/file-clean.settings.model";
import { ClientSettings } from "@/settings/models/client-setting.model";

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  @AutoMap()
  id: number;

  @Column("simple-json", { nullable: true })
  @AutoMap()
  [serverSettingsKey]?: ServerSetting;

  @Column("simple-json", { nullable: true })
  @AutoMap()
  [clientSettingsKey]?: ClientSettings;

  @Column("simple-json", { nullable: true })
  @AutoMap()
  [fileCleanSettingsKey]?: FileCleanSettings;
}
