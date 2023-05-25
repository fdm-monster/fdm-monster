import { Injectable } from "@nestjs/common";
import { Settings } from "@/settings/entities/settings.entity";
import { SettingsDto } from "@/settings/dto/settings.dto";
import { CrudService } from "@/shared/crud.service";

@Injectable()
export class SettingsService extends CrudService<Settings, {}, SettingsDto, SettingsDto>(Settings) {}
