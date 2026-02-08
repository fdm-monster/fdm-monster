import type { SerialSettingsDto } from "@/services/octoprint/dto/settings/serial-settings.dto";
import {
  Api,
  Appearance,
  Devel,
  Feature,
  Folder,
  GcodeAnalysis,
  Plugins,
  Scripts,
  Server,
  Slicing,
  System,
  Temperature,
  TerminalFilter,
  Webcam,
} from "./settings-parts.type";

export interface SettingsDto {
  api: Api;
  appearance: Appearance;
  devel: Devel;
  feature: Feature;
  folder: Folder;
  gcodeAnalysis: GcodeAnalysis;
  plugins: Plugins;
  scripts: Scripts;
  serial: SerialSettingsDto;
  server: Server;
  slicing: Slicing;
  system: System;
  temperature: Temperature;
  terminalFilters: TerminalFilter[];
  webcam: Webcam;
}
