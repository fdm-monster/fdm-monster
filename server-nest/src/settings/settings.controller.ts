import { Body, Controller, Get, Logger, Patch, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Settings } from "@/settings/entities/settings.entity";
import { SettingsDto, SettingsWithConnectionDto } from "@/settings/dto/settings.dto";
import { SettingsCache } from "@/settings/settings.cache";
import { Roles } from "@/shared/decorators/role.decorator";
import { Role } from "@/users/user.constants";
import { UpdateFileCleanSettingsDto } from "@/settings/dto/update-file-clean.settings.dto";
import { UpdateClientSettingsDto } from "@/settings/dto/update-client.settings.dto";
import { Request } from "express";
import { address } from "ip";
import { SentryService } from "@ntegral/nestjs-sentry";
import { version } from "@/../package.json";

@Controller("settings")
@ApiTags("Settings")
@Roles(Role.Admin)
export class SettingsController {
  logger = new Logger(SettingsController.name);

  constructor(private settingsCache: SettingsCache, private sentry: SentryService) {}

  @ApiOkResponse({
    type: SettingsDto,
  })
  @Get()
  async get() {
    return this.settingsCache.getOrCreate();
  }

  @ApiOkResponse({
    type: SettingsWithConnectionDto,
  })
  @Get("with-connection")
  async getWithConnection(@Req() req: Request) {
    const settings = await this.settingsCache.getOrCreate();

    // Safely get IP address
    let connection;
    try {
      const serverIp = address();
      connection = {
        clientIp: req.socket?.remoteAddress,
        ip: serverIp,
        version,
      };
    } catch (e) {
      this.sentry.instance().captureException(e);
      this.logger.warn("Could not fetch server IP address");
    }

    return {
      settings,
      connection,
    } as SettingsWithConnectionDto;
  }

  @ApiOkResponse({
    type: SettingsDto,
  })
  @Patch("client-settings")
  async updateClientSettings(@Body() updateDto: UpdateClientSettingsDto) {
    return this.settingsCache.updateClientSettings(updateDto);
  }

  @ApiOkResponse({
    type: SettingsDto,
  })
  @Patch("file-clean")
  async updateFileCleanSettings(@Body() updateDto: UpdateFileCleanSettingsDto) {
    return this.settingsCache.updateFileCleanSettings(updateDto);
  }
}
