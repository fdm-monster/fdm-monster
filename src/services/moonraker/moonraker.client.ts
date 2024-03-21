import axios, { AxiosStatic } from "axios";
import { ServerInfoDto } from "@/services/moonraker/dto/server-info.dto";
import { LoginDto } from "@/services/interfaces/login.dto";
import { ResultDto } from "./dto/result.dto";
import { ServerConfigDto } from "@/services/moonraker/dto/server-config.dto";
import { TemperatureStoreDto } from "@/services/moonraker/dto/temperature-store.dto";
import { GcodeStoreDto } from "@/services/moonraker/dto/gcode-store.dto";
import { ActionResultDto } from "@/services/moonraker/dto/action-result.dto";
import { PrinterInfoDto } from "@/services/moonraker/dto/printer-info.dto";
import { PrinterAvailableObjects } from "@/services/moonraker/dto/printer-objects-list.dto";
import { PrinterObjectsQueryDto } from "@/services/moonraker/dto/printer-objects-query.dto";
import { PrinterQueryEndstopsDto } from "@/services/moonraker/dto/printer-query-endstops.dto";
import { GcodeHelpDto } from "@/services/moonraker/dto/gcode-help.dto";
import { MachineSystemInfoDto } from "@/services/moonraker/dto/machine-system-info.dto";
import { ProcessStatsDto } from "@/services/moonraker/dto/process-stats.dto";
import { SudoInfoDto } from "@/services/moonraker/dto/sudo-info.dto";
import { SudoResponseDto } from "@/services/moonraker/dto/sudo-response.dto";
import { MachinePeripheralsUsbDto } from "@/services/moonraker/dto/machine-peripherals-usb.dto";
import { MachinePeripheralsSerialDto } from "@/services/moonraker/dto/machine-peripherals-serial.dto";
import { MachinePeripheralsVideoDto } from "@/services/moonraker/dto/machin-peripherals-video.dto";
import { MachinePeripheralsCanbusDto } from "@/services/moonraker/dto/machine-peripherals-canbus.dto";
import { ServerFileDto } from "@/services/moonraker/dto/server-file.dto";
import { ServerFileRootDto } from "@/services/moonraker/dto/server-file-root.dto";
import { ServerFileMetadataDto } from "@/services/moonraker/dto/server-file-metadata.dto";
import { ServerFileThumbnailDto } from "@/services/moonraker/dto/server-file-thumbnail.dto";
import { ServerFileDirectoryInfoDto } from "@/services/moonraker/dto/server-file-directory-info.dto";
import {
  ServerFileDirectoryActionDto,
  ServerFileDirectoryMovedDto,
} from "@/services/moonraker/dto/server-file-directory-action.dto";
import { ServerFileZipActionDto } from "@/services/moonraker/dto/server-file-zip-action.dto";
import FormData from "form-data";
import { createReadStream, ReadStream } from "fs";
import { uploadProgressEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { AccessLoginResultDto } from "@/services/moonraker/dto/access-login-result.dto";
import { AccessUserResultDto } from "@/services/moonraker/dto/access-user-result.dto";
import { AccessUserDto } from "@/services/moonraker/dto/access-user.dto";
import { AccessUserDeleteDto } from "@/services/moonraker/dto/access-user-delete.dto";
import { AccessLoginRefreshDto } from "@/services/moonraker/dto/access-login-refresh.dto";
import { AccessInfoDto } from "@/services/moonraker/dto/access-info.dto";

export class MoonrakerClient {
  private httpClient: AxiosStatic;
  private eventEmitter2: EventEmitter2;

  constructor({ httpClient, eventEmitter2 }: { httpClient: AxiosStatic; eventEmitter2: EventEmitter2 }) {
    this.httpClient = httpClient;
    this.eventEmitter2 = eventEmitter2;
  }

  async getServerInfo(login: LoginDto) {
    return this.httpClient.get<ResultDto<ServerInfoDto>>(`${login.printerURL}/server/info`);
  }

  async getServerConfig(login: LoginDto) {
    return this.httpClient.get<ResultDto<ServerConfigDto>>(`${login.printerURL}/server/config`);
  }

  async getTemperatureStore(login: LoginDto, includeMonitors: boolean = false) {
    return this.httpClient.get<ResultDto<TemperatureStoreDto>>(
      `${login.printerURL}/server/temperature_store?include_monitors=${!!includeMonitors}`
    );
  }

  async getGcodeStore(login: LoginDto, count: number = 100) {
    return this.httpClient.get<ResultDto<GcodeStoreDto>>(`${login.printerURL}/server/gcode_store?count=${count}`);
  }

  async postRolloverLogs(login: LoginDto, application: "moonraker" | "klipper" | "" = "") {
    return this.httpClient.post<ResultDto<GcodeStoreDto>>(`${login.printerURL}/server/logs/rollover`, { application });
  }

  async postRestartServer(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/server/restart`);
  }

  async getPrinterInfo(login: LoginDto) {
    return this.httpClient.post<ResultDto<PrinterInfoDto>>(`${login.printerURL}/printer/info`);
  }

  async postEmergencyStop(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/emergency_stop`);
  }

  async postHostRestart(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/restart`);
  }

  async postFirmwareRestart(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/firmware_restart`);
  }

  async getPrinterObjectsList(login: LoginDto) {
    return this.httpClient.get<ResultDto<PrinterAvailableObjects>>(`${login.printerURL}/printer/objects/list`);
  }

  async getPrinterObjectsQuery(
    login: LoginDto,
    query: Record<string, string[]> = {
      gcode_move: [],
      toolhead: [],
      extruder: [], // ["target", "temperature"],
    }
  ) {
    const queryString = Object.entries(query)
      .reduce((acc, [key, value]) => {
        if (value.length > 0) {
          acc.push(`${key}=${value.join(",")}`);
        } else {
          acc.push(key);
        }
        return acc;
      }, [])
      .join("&");
    return this.httpClient.get<ResultDto<PrinterObjectsQueryDto>>(`${login.printerURL}/printer/objects/query?${queryString}`);
  }

  async getPrinterQueryEndstops(login: LoginDto) {
    return this.httpClient.get<ResultDto<PrinterQueryEndstopsDto>>(`${login.printerURL}/printer/query-endstops`);
  }

  async postGcodeScript(login: LoginDto, script: string = "G28") {
    return this.httpClient.get<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/gcode/script?script=${script}`);
  }

  async getGcodeHelp(login: LoginDto) {
    return this.httpClient.get<ResultDto<GcodeHelpDto>>(`${login.printerURL}/printer/gcode/help`);
  }

  async postPrintStart(login: LoginDto, filename: string) {
    // will throw 400 if SD busy
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/print/start?filename=${filename}`);
  }

  async postPrintPause(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/print/pause`);
  }

  async postPrintResume(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/print/resume`);
  }

  async postPrintCancel(login: LoginDto) {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/printer/print/cancel`);
  }

  async getMachineSystemInfo(login: LoginDto) {
    return this.httpClient.get<ResultDto<MachineSystemInfoDto>>(`${login.printerURL}/machine/system_info`);
  }

  async postMachineShutdown(login: LoginDto) {
    // Will result in error.
    return this.httpClient.post<null>(`${login.printerURL}/machine/shutdown`);
  }

  async postMachineReboot(login: LoginDto) {
    // Will result in error.
    return this.httpClient.post<null>(`${login.printerURL}/machine/reboot`);
  }

  async postMachineRestartService(
    login: LoginDto,
    service: "crowsnest" | "MoonCord" | "moonraker" | "moonraker-telegram-bot" | "klipper" | "KlipperScreen" | "sonar" | "webcamd"
  ) {
    // Can result in 500 if klipper fails to start
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/machine/services/restart?service=${service}`);
  }

  async postMachineStartService(login: LoginDto, service: "webcamd" | "klipper") {
    return this.httpClient.post<ResultDto<ActionResultDto>>(`${login.printerURL}/machine/services/restart?service=${service}`);
  }

  async postMachineProcessStats(login: LoginDto) {
    // Will result in error.
    return this.httpClient.post<ResultDto<ProcessStatsDto>>(`${login.printerURL}/machine/proc_stats`);
  }

  async getMachineSudoInfo(login: LoginDto, checkAccess: boolean = false) {
    return this.httpClient.get<ResultDto<SudoInfoDto>>(`${login.printerURL}/machine/sudo/info?check_access=${checkAccess}`);
  }

  async postMachineSetSudoPassword(login: LoginDto, password: string) {
    // Does not persist across reboots
    return this.httpClient.post<ResultDto<SudoResponseDto>>(`${login.printerURL}/machine/sudo/password`, {
      password,
    });
  }

  async getMachineListPeripheralsUsb(login: LoginDto) {
    return this.httpClient.get<ResultDto<MachinePeripheralsUsbDto>>(`${login.printerURL}/machine/peripherals/usb`);
  }

  async getMachineListPeripheralsSerial(login: LoginDto) {
    return this.httpClient.get<ResultDto<MachinePeripheralsSerialDto>>(`${login.printerURL}/machine/peripherals/serial`);
  }

  async getMachineListPeripheralsVideo(login: LoginDto) {
    return this.httpClient.get<ResultDto<MachinePeripheralsVideoDto>>(`${login.printerURL}/machine/peripherals/video`);
  }

  async getMachineListPeripheralsCanbus(login: LoginDto, canInterface: "can0" | "can1" | string = "can0") {
    return this.httpClient.get<ResultDto<MachinePeripheralsCanbusDto>>(
      `${login.printerURL}/machine/peripherals/canbus?interface=${canInterface}`
    );
  }

  async getServerFilesList(login: LoginDto, rootFolder = "") {
    const paramString = rootFolder?.length ? `?root=${rootFolder}` : "";
    return this.httpClient.get<ResultDto<ServerFileDto[]>>(`${login.printerURL}/server/files/list${paramString}`);
  }

  async getServerFilesRoots(login: LoginDto) {
    return this.httpClient.get<ResultDto<ServerFileRootDto[]>>(`${login.printerURL}/server/files/roots`);
  }

  async getServerFileMetadata(login: LoginDto, filename: string) {
    return this.httpClient.get<ResultDto<ServerFileMetadataDto>>(
      `${login.printerURL}/server/files/metadata?filename=${filename}`
    );
  }

  async getServerFileMetadataScan(login: LoginDto, filename: string) {
    return this.httpClient.get<ResultDto<ServerFileMetadataDto>>(
      `${login.printerURL}/server/files/metascan?filename=${filename}`
    );
  }

  async getServerFilesThumbnails(login: LoginDto, filename: string) {
    return this.httpClient.get<ResultDto<ServerFileThumbnailDto[]>>(
      `${login.printerURL}/server/files/thumbnails?filename=${filename}`
    );
  }

  async getServerFilesDirectoryInfo(login: LoginDto, path: string, extended: boolean) {
    return this.httpClient.get<ResultDto<ServerFileDirectoryInfoDto>>(
      `${login.printerURL}/server/files/directory?path=${path}&extended=${extended}`
    );
  }

  async postServerFilesDirectory(login: LoginDto, path: string) {
    return this.httpClient.post<ResultDto<ServerFileDirectoryActionDto>>(`${login.printerURL}/server/files/directory`, { path });
  }

  async deleteServerFilesDirectory(login: LoginDto, path: string, force: boolean) {
    return this.httpClient.delete<ResultDto<ServerFileDirectoryActionDto>>(
      `${login.printerURL}/server/files/directory?path=${path}&force=${!!force}`
    );
  }

  async postServerFilesMove(login: LoginDto, source: string, dest: string) {
    return this.httpClient.post<ResultDto<ServerFileDirectoryMovedDto>>(`${login.printerURL}/server/files/directory`, {
      source,
      dest,
    });
  }

  async postServerFilesCopy(login: LoginDto, source: string, dest: string) {
    return this.httpClient.post<ResultDto<ServerFileDirectoryActionDto>>(`${login.printerURL}/server/files/copy`, {
      source,
      dest,
    });
  }

  async postServerFilesZip(login: LoginDto, items: string[], dest: string, store_only: boolean) {
    return this.httpClient.post<ResultDto<ServerFileZipActionDto>>(`${login.printerURL}/server/files/zip`, {
      items,
      store_only,
      dest,
    });
  }

  async getServerFilesDownload(login: LoginDto, root: string, filename: string) {
    return await this.httpClient.get(`${login.printerURL}/server/files/${root}/${filename}`, {
      responseType: "stream",
    });
  }

  async postServerFileUpload(
    login: LoginDto,
    multerFileOrBuffer: Buffer | Express.Multer.File,
    root?: string,
    path?: string,
    checksum?: string,
    progressToken?: string
  ) {
    const formData = new FormData();
    if (root?.length) {
      formData.append("root", root);
    }
    if (path?.length) {
      formData.append("path", path);
    }
    if (checksum?.length) {
      formData.append("checksum", checksum);
    }

    let source: ArrayBufferLike | ReadStream = (multerFileOrBuffer as Buffer).buffer;
    const isPhysicalFile = !source;
    if (isPhysicalFile) {
      source = createReadStream((multerFileOrBuffer as Express.Multer.File).path);
    }
    formData.append("file", source, { filename: (multerFileOrBuffer as Express.Multer.File).originalname });

    // Calculate the header that axios uses to determine progress
    const result: number = await new Promise<number>((resolve, reject) => {
      return formData.getLength((err, length) => {
        if (err) resolve(null);
        resolve(length);
      });
    });

    const headers = {
      ...formData.getHeaders(),
      "Content-Length": result,
    };

    return await axios({
      method: "POST",
      url: `${login.printerURL}/server/files/upload`,
      data: formData,
      headers,
      onUploadProgress: (p) => {
        if (progressToken) {
          this.eventEmitter2.emit(`${uploadProgressEvent(progressToken)}`, progressToken, p);
        }
      },
    });
  }

  async deleteServerFile(login: LoginDto, root: string, path: string) {
    return this.httpClient.delete<ResultDto<ServerFileDirectoryActionDto>>(`${login.printerURL}/server/files/${root}}/${path}`);
  }

  async getServerFileKlippyLogDownload(login: LoginDto) {
    return this.httpClient.get<string>(`${login.printerURL}/server/files/klippy.log`);
  }

  async getServerFileMoonrakerLogDownload(login: LoginDto) {
    return this.httpClient.get<string>(`${login.printerURL}/server/files/moonraker.log`);
  }

  async postAccessLoginUser(login: LoginDto, username: string, password: string, source: "ldap" | "moonraker" = "moonraker") {
    return this.httpClient.post<ResultDto<AccessLoginResultDto>>("/access/login", {
      username,
      password,
      source,
    });
  }

  async postAccessLogoutUser(login: LoginDto) {
    // requires a bearer mechanism
    return this.httpClient.post<ResultDto<AccessUserResultDto>>(`${login.printerURL}/access/logout`);
  }

  async getAccessUser(login: LoginDto) {
    // requires a bearer mechanism
    return this.httpClient.get<ResultDto<AccessUserDto>>(`${login.printerURL}/access/user`);
  }

  async postAccessCreateUser(login: LoginDto, username: string, password: string) {
    return this.httpClient.post<ResultDto<AccessLoginResultDto>>(`${login.printerURL}/access/login`, {
      username,
      password,
    });
  }

  async deleteAccessUser(login: LoginDto, username: string) {
    return this.httpClient.delete<ResultDto<AccessUserResultDto>>(`${login.printerURL}/access/user`, {
      data: {
        username,
      },
    });
  }

  async listAccessUsers(login: LoginDto) {
    // requires a bearer mechanism
    return this.httpClient.get<ResultDto<AccessUserDto[]>>(`${login.printerURL}/access/user/list`);
  }

  async postAccessResetPassword(login: LoginDto, refresh_token: string) {
    return this.httpClient.post<ResultDto<AccessLoginRefreshDto>>(`${login.printerURL}/access/refresh_jwt`, {
      refresh_token,
    });
  }

  async getAccessOneshotToken(login: LoginDto) {
    return this.httpClient.get<ResultDto<string>>(`${login.printerURL}/access/oneshot_token`);
  }

  async getAccessInfo(login: LoginDto) {
    return this.httpClient.get<ResultDto<AccessInfoDto>>(`${login.printerURL}/access/info`);
  }

  async getAccessApiKey(login: LoginDto) {
    return this.httpClient.get<ResultDto<string>>(`${login.printerURL}/access/api_key`);
  }

  async postAccessApiKeyCreate(login: LoginDto) {
    return this.httpClient.post<ResultDto<string>>(`${login.printerURL}/access/api_key`);
  }
}
