import { AxiosPromise } from "axios";
import { LoginDto } from "@/services/interfaces/login.dto";
import { ServerConfigDto } from "@/services/moonraker/dto/server/server-config.dto";
import { SettingsDto } from "@/services/octoprint/dto/settings/settings.dto";
import { ConnectionState } from "@/services/octoprint/dto/connection/connection-state.type";
import { IdType } from "@/shared.constants";
import { Flags } from "@/services/moonraker/dto/octoprint-compat/api-printer.dto";

export const OctoprintType = 0;
export const MoonrakerType = 1;
export const PrusaLinkType = 2;
export const BambuType = 3;

export enum PrinterTypesEnum {
  Octoprint = OctoprintType,
  Moonraker = MoonrakerType,
  PrusaLink = PrusaLinkType,
  Bambu = BambuType
}

export type PrinterType = typeof OctoprintType | typeof MoonrakerType | typeof PrusaLinkType | typeof BambuType;

export interface FdmCurrentMessageDto {
  progress: {
    printTime: number | null,
    completion: number | null
  },
  state: {
    text: string,
    error: string,
    flags: Flags
  },
  job: {
    file: {
      name: string,
      path: string
    }
  }
}

export interface StatusFlags {
  connected: boolean;
  operational: boolean;
  printing: boolean;
  paused: boolean;
  error: boolean;
  finished: boolean;
}

export interface FileDto {
  path: string;
  size: number;
  date: number | null;
}

export enum ReprintState {
  PrinterNotAvailable = 0,
  NoLastPrint = 1,
  LastPrintReady = 2,
}

export interface PartialReprintFileDto {
  file?: FileDto;
  reprintState: ReprintState;
  connectionState: ConnectionState | null;
}

export interface ReprintFileDto extends PartialReprintFileDto {
  printerId: IdType;
}

export interface IPrinterApi {
  get type(): PrinterType;

  set login(login: LoginDto);

  getVersion(): Promise<string>;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  restartServer(): Promise<void>;

  restartHost(): Promise<void>;

  restartPrinterFirmware(): Promise<void>;

  startPrint(path: string): Promise<void>;

  pausePrint(): Promise<void>;

  resumePrint(): Promise<void>;

  cancelPrint(): Promise<void>;

  quickStop(): Promise<void>;

  sendGcode(script: string): Promise<void>;

  movePrintHead(amounts: { x?: number; y?: number; z?: number; speed?: number }): Promise<void>;

  homeAxes(axes: { x?: boolean; y?: boolean; z?: boolean }): Promise<void>;

  getFile(path: string): Promise<FileDto>;

  getFiles(): Promise<FileDto[]>;

  downloadFile(path: string): AxiosPromise<NodeJS.ReadableStream>;

  getFileChunk(path: string, startBytes: number, endBytes: number): AxiosPromise<string>;

  uploadFile(fileOrBuffer: Buffer | Express.Multer.File, startPrint: boolean, uploadToken?: string): Promise<void>;

  deleteFile(path: string): Promise<void>;

  deleteFolder(path: string): Promise<void>;

  getSettings(): Promise<ServerConfigDto | SettingsDto>;

  getReprintState(): Promise<PartialReprintFileDto>;
}
