import { ServerSettingsDto } from "@/settings/dto/server.settings.dto";
import { FileCleanSettingsDto } from "@/settings/dto/file-clean.settings.dto";
import { ClientSettingsDto } from "@/settings/dto/client-settings.dto";

export const serverSettingsKey = "server";
export const getDefaultServerSettings = () =>
  ({
    requireLogin: true,
  } as ServerSettingsDto);

export const clientSettingsKey = "client";
export const getDefaultClientSettings = () => ({} as ClientSettingsDto);

export const fileCleanSettingsKey = "fileClean";
export const getDefaultFileCleanSettings = () => ({} as FileCleanSettingsDto);

export const getDefaultSettings = () => ({
  [serverSettingsKey]: getDefaultServerSettings(),
  [clientSettingsKey]: getDefaultClientSettings(),
  [fileCleanSettingsKey]: getDefaultFileCleanSettings(),
});
