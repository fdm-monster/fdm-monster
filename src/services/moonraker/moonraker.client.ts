import { AxiosError, AxiosResponse } from "axios";
import type { ServerInfoDto } from "@/services/moonraker/dto/server/server-info.dto";
import type { LoginDto } from "@/services/interfaces/login.dto";
import type { ResultDto } from "./dto/rest/result.dto";
import type { ServerConfigDto } from "@/services/moonraker/dto/server/server-config.dto";
import type { TemperatureStoreDto } from "@/services/moonraker/dto/temperature-store.dto";
import type { GcodeStoreDto } from "@/services/moonraker/dto/gcode-store.dto";
import type { ActionResultDto } from "@/services/moonraker/dto/rest/action-result.dto";
import type { PrinterInfoDto } from "@/services/moonraker/dto/printer-info.dto";
import { KnownPrinterObject, PrinterAvailableObjects } from "@/services/moonraker/dto/objects/printer-objects-list.dto";
import type { PrinterQueryEndstopsDto } from "@/services/moonraker/dto/printer-query-endstops.dto";
import type { GcodeHelpDto } from "@/services/moonraker/dto/gcode-help.dto";
import type { MachineSystemInfoDto } from "@/services/moonraker/dto/machine/machine-system-info.dto";
import type { ProcessStatsDto } from "@/services/moonraker/dto/process-stats.dto";
import type { SudoInfoDto } from "@/services/moonraker/dto/sudo-info.dto";
import type { SudoResponseDto } from "@/services/moonraker/dto/sudo-response.dto";
import type { MachinePeripheralsUsbDto } from "@/services/moonraker/dto/machine/machine-peripherals-usb.dto";
import type { MachinePeripheralsSerialDto } from "@/services/moonraker/dto/machine/machine-peripherals-serial.dto";
import type { MachinePeripheralsVideoDto } from "@/services/moonraker/dto/machine/machine-peripherals-video.dto";
import type { MachinePeripheralsCanbusDto } from "@/services/moonraker/dto/machine/machine-peripherals-canbus.dto";
import type { ServerFileDto } from "@/services/moonraker/dto/server-files/server-file.dto";
import type { ServerFileRootDto } from "@/services/moonraker/dto/server-files/server-file-root.dto";
import type { ServerFileMetadataDto } from "@/services/moonraker/dto/server-files/server-file-metadata.dto";
import type { ServerFileThumbnailDto } from "@/services/moonraker/dto/server-files/server-file-thumbnail.dto";
import type { ServerFileDirectoryInfoDto } from "@/services/moonraker/dto/server-files/server-file-directory-info.dto";
import {
  ServerFileDirectoryActionDto,
  ServerFileDirectoryMovedDto,
} from "@/services/moonraker/dto/server-files/server-file-directory-action.dto";
import type { ServerFileZipActionDto } from "@/services/moonraker/dto/server-files/server-file-zip-action.dto";
import FormData from "form-data";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import type { AccessLoginResultDto } from "@/services/moonraker/dto/access/access-login-result.dto";
import type { AccessUserResultDto } from "@/services/moonraker/dto/access/access-user-result.dto";
import type { AccessUserDto } from "@/services/moonraker/dto/access/access-user.dto";
import type { AccessLoginRefreshDto } from "@/services/moonraker/dto/access/access-login-refresh.dto";
import type { AccessInfoDto } from "@/services/moonraker/dto/access/access-info.dto";
import { Namespaces, type DatabaseNamespaceListDto } from "@/services/moonraker/dto/database/database-namespace-list.dto";
import type { DatabaseNamespaceItemDto } from "@/services/moonraker/dto/database/database-namespace-item.dto";
import type { JobQueueStatusDto } from "@/services/moonraker/dto/job-queue/job-queue-status.dto";
import type { EnqueueJobDto } from "@/services/moonraker/dto/job-queue/enqueue-job.dto";
import type { AnnouncementListDto } from "@/services/moonraker/dto/server-announcements/announcement-list.dto";
import type { AnnouncementEntryIdDto } from "@/services/moonraker/dto/server-announcements/announcement-entry-id.dto";
import type { AnnouncementFeedsDto } from "@/services/moonraker/dto/server-announcements/announcement-feeds.dto";
import type { AnnouncementActionDto } from "@/services/moonraker/dto/server-announcements/announcement-action.dto";
import type { WebcamDto, WebcamListDto } from "@/services/moonraker/dto/server-webcams/webcam-list.dto";
import type { WebcamItemDto } from "@/services/moonraker/dto/server-webcams/webcam-item.dto";
import type { WebcamTestDto } from "@/services/moonraker/dto/server-webcams/webcam-test.dto";
import type { NotifierListDto } from "@/services/moonraker/dto/notifier-list.dto";
import type { MachineUpdateStatusDto } from "@/services/moonraker/dto/machine/machine-update-status.dto";
import type { MachineDevicePowerDevicesDto } from "@/services/moonraker/dto/machine/machine-device-power-devices.dto";
import type { MachineDevicePowerDeviceStateDto } from "@/services/moonraker/dto/machine/machine-device-power-device-state.dto";
import type { MachineWledStripsDto } from "@/services/moonraker/dto/machine/machine-wled-strips.dto";
import type { JsonRpcResponseDto } from "@/services/moonraker/dto/rpc/json-rpc-response.dto";
import type { JsonRpcRequestDto } from "@/services/moonraker/dto/rpc/json-rpc-request.dto";
import type { SensorListDto } from "@/services/moonraker/dto/server-sensors/sensor-list.dto";
import type { SensorsMeasurementsDto } from "@/services/moonraker/dto/server-sensors/sensor-measurements.dto";
import type { SensorDto } from "@/services/moonraker/dto/server-sensors/sensor-info.dto";
import type { SpoolmanStatusDto } from "@/services/moonraker/dto/spoolman/spoolman-status.dto";
import type { SpoolmanActiveSpoolDto } from "@/services/moonraker/dto/spoolman/spoolman-active-spool.dto";
import type { SpoolmanProxyRequestDto } from "@/services/moonraker/dto/spoolman/spoolman-proxy-request.dto";
import type { SpoolmanResponseDto } from "@/services/moonraker/dto/spoolman/spoolman-response.dto";
import type { ApiVersionDto } from "@/services/moonraker/dto/octoprint-compat/api-version.dto";
import type { ServerVersionDto } from "@/services/moonraker/dto/octoprint-compat/server-version.dto";
import type { ApiLoginDto } from "@/services/moonraker/dto/octoprint-compat/api-login.dto";
import type { ApiSettingsDto } from "@/services/moonraker/dto/octoprint-compat/api-settings.dto";
import type { ApiJobDto } from "@/services/moonraker/dto/octoprint-compat/api-job.dto";
import type { ApiPrinterDto } from "@/services/moonraker/dto/octoprint-compat/api-printer.dto";
import type { ApiProfilesDto } from "@/services/moonraker/dto/octoprint-compat/api-profiles.dto";
import type { HistoryListDto } from "@/services/moonraker/dto/server-history/history-list.dto";
import type { HistoryTotalsDto } from "@/services/moonraker/dto/server-history/history-totals.dto";
import type { HistoryLastTotalsDto } from "@/services/moonraker/dto/server-history/history-last-totals.dto";
import type { HistoryJobDto } from "@/services/moonraker/dto/server-history/history-job.dto";
import type { PrinterObjectsQueryDto } from "@/services/moonraker/dto/objects/printer-objects-query.dto";
import { DefaultHttpClientBuilder } from "@/shared/default-http-client.builder";
import { HttpClientFactory } from "@/services/core/http-client.factory";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { SettingsStore } from "@/state/settings.store";

export class MoonrakerClient {
  protected logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly httpClientFactory: HttpClientFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly settingsStore: SettingsStore,
  ) {
    this.logger = loggerFactory(MoonrakerClient.name);
  }

  async getServerInfo(login: LoginDto) {
    return this.createClient(login).get<ResultDto<ServerInfoDto>>("/server/info");
  }

  async getServerConfig(login: LoginDto) {
    return this.createClient(login).get<ResultDto<ServerConfigDto>>("/server/config");
  }

  async getTemperatureStore(login: LoginDto, includeMonitors: boolean = false) {
    return this.createClient(login).get<ResultDto<TemperatureStoreDto>>(
      `/server/temperature_store?include_monitors=${!!includeMonitors}`,
    );
  }

  async getGcodeStore(login: LoginDto, count: number = 100) {
    return this.createClient(login).get<ResultDto<GcodeStoreDto>>(`/server/gcode_store?count=${count}`);
  }

  async postRolloverLogs(login: LoginDto, application: "moonraker" | "klipper" | "" = "") {
    return this.createClient(login).post<ResultDto<GcodeStoreDto>>(`server/logs/rollover`, { application });
  }

  async postRestartServer(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`server/restart`);
  }

  async postJsonRpc<I, O>(login: LoginDto, method: string, params?: I, id?: number) {
    return this.createClient(login).post<
      JsonRpcResponseDto<O>,
      AxiosResponse<JsonRpcResponseDto<O>>,
      JsonRpcRequestDto<I>
    >(`server/jsonrpc`, {
      jsonrpc: "2.0",
      id: id ? id : 0,
      method,
      params,
    });
  }

  async getPrinterInfo(login: LoginDto) {
    return this.createClient(login).post<ResultDto<PrinterInfoDto>>(`printer/info`);
  }

  async postQuickStop(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/emergency_stop`);
  }

  async postHostRestart(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/restart`);
  }

  async postFirmwareRestart(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/firmware_restart`);
  }

  async getPrinterObjectsList(login: LoginDto) {
    return this.createClient(login).get<ResultDto<PrinterAvailableObjects>>(`printer/objects/list`);
  }

  async getPrinterObjectsQuery<R = PrinterObjectsQueryDto>(
    login: LoginDto,
    query: Partial<Record<KnownPrinterObject, string[]>>,
  ) {
    const queryString = this.convertToQueryString(query);
    return this.createClient(login).get<ResultDto<R>>(`printer/objects/query?${queryString}`);
  }

  postSubscribePrinterObjects<R = PrinterObjectsQueryDto>(
    login: LoginDto,
    connectionId: number,
    query: Partial<Record<KnownPrinterObject, string[]>>,
  ) {
    const queryString = this.convertToQueryString(query);
    return this.createClient(login).post<ResultDto<R>>(
      `printer/objects/subscribe?connection_id=${connectionId}&${queryString}`,
    );
  }

  async getPrinterQueryEndstops(login: LoginDto) {
    return this.createClient(login).get<ResultDto<PrinterQueryEndstopsDto>>(`printer/query-endstops`);
  }

  async postGcodeScript(login: LoginDto, script: string = "G28") {
    return this.createClient(login).get<ResultDto<ActionResultDto>>(`printer/gcode/script?script=${script}`);
  }

  async getGcodeHelp(login: LoginDto) {
    return this.createClient(login).get<ResultDto<GcodeHelpDto>>(`printer/gcode/help`);
  }

  async postPrintStart(login: LoginDto, filename: string) {
    // will throw 400 if SD busy
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/print/start?filename=${filename}`);
  }

  async postPrintPause(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/print/pause`);
  }

  async postPrintResume(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/print/resume`);
  }

  async postPrintCancel(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`printer/print/cancel`);
  }

  async getMachineSystemInfo(login: LoginDto) {
    return this.createClient(login).get<ResultDto<MachineSystemInfoDto>>(`machine/system_info`);
  }

  async postMachineShutdown(login: LoginDto) {
    // Will result in error.
    return this.createClient(login).post<null>(`machine/shutdown`);
  }

  async postMachineReboot(login: LoginDto) {
    // Will result in error.
    return this.createClient(login).post<null>(`machine/reboot`);
  }

  async postMachineRestartService(
    login: LoginDto,
    service:
      | "crowsnest"
      | "MoonCord"
      | "moonraker"
      | "moonraker-telegram-bot"
      | "klipper"
      | "KlipperScreen"
      | "sonar"
      | "webcamd",
  ) {
    // Can result in 500 if klipper fails to start
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/services/restart?service=${service}`);
  }

  async postMachineStartService(login: LoginDto, service: "webcamd" | "klipper") {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/services/restart?service=${service}`);
  }

  async postMachineProcessStats(login: LoginDto) {
    // Will result in error.
    return this.createClient(login).post<ResultDto<ProcessStatsDto>>(`machine/proc_stats`);
  }

  async getMachineSudoInfo(login: LoginDto, checkAccess: boolean = false) {
    return this.createClient(login).get<ResultDto<SudoInfoDto>>(`machine/sudo/info?check_access=${checkAccess}`);
  }

  async postMachineSetSudoPassword(login: LoginDto, password: string) {
    // Does not persist across reboots
    return this.createClient(login).post<ResultDto<SudoResponseDto>>(`machine/sudo/password`, {
      password,
    });
  }

  async getMachineListPeripheralsUsb(login: LoginDto) {
    return this.createClient(login).get<ResultDto<MachinePeripheralsUsbDto>>(`machine/peripherals/usb`);
  }

  async getMachineListPeripheralsSerial(login: LoginDto) {
    return this.createClient(login).get<ResultDto<MachinePeripheralsSerialDto>>(`machine/peripherals/serial`);
  }

  async getMachineListPeripheralsVideo(login: LoginDto) {
    return this.createClient(login).get<ResultDto<MachinePeripheralsVideoDto>>(`machine/peripherals/video`);
  }

  async getMachineListPeripheralsCanbus(login: LoginDto, canInterface: "can0" | "can1" | string = "can0") {
    return this.createClient(login).get<ResultDto<MachinePeripheralsCanbusDto>>(
      `machine/peripherals/canbus?interface=${canInterface}`,
    );
  }

  async getServerFilesList(login: LoginDto, rootFolder = "") {
    const paramString = rootFolder?.length ? `?root=${rootFolder}` : "";
    return this.createClient(login).get<ResultDto<ServerFileDto[]>>(`server/files/list${paramString}`);
  }

  async getServerFilesRoots(login: LoginDto) {
    return this.createClient(login).get<ResultDto<ServerFileRootDto[]>>(`server/files/roots`);
  }

  async getServerFileMetadata(login: LoginDto, filename: string) {
    return this.createClient(login).get<ResultDto<ServerFileMetadataDto>>(`server/files/metadata?filename=${filename}`);
  }

  async getServerFileMetadataScan(login: LoginDto, filename: string) {
    return this.createClient(login).get<ResultDto<ServerFileMetadataDto>>(`server/files/metascan?filename=${filename}`);
  }

  async getServerFilesThumbnails(login: LoginDto, filename: string) {
    return this.createClient(login).get<ResultDto<ServerFileThumbnailDto[]>>(
      `server/files/thumbnails?filename=${filename}`,
    );
  }

  async getServerFilesDirectoryInfo(login: LoginDto, path: string, extended: boolean) {
    return this.createClient(login).get<ResultDto<ServerFileDirectoryInfoDto>>(
      `server/files/directory?path=${path}&extended=${extended}`,
    );
  }

  async postServerFilesDirectory(login: LoginDto, path: string) {
    return this.createClient(login).post<ResultDto<ServerFileDirectoryActionDto>>(`server/files/directory`, {
      path,
    });
  }

  async deleteServerFilesDirectory(login: LoginDto, path: string, force: boolean) {
    return this.createClient(login).delete<ResultDto<ServerFileDirectoryActionDto>>(
      `server/files/directory?path=${path}&force=${!!force}`,
    );
  }

  async postServerFilesMove(login: LoginDto, source: string, dest: string) {
    return this.createClient(login).post<ResultDto<ServerFileDirectoryMovedDto>>(`server/files/directory`, {
      source,
      dest,
    });
  }

  async postServerFilesCopy(login: LoginDto, source: string, dest: string) {
    return this.createClient(login).post<ResultDto<ServerFileDirectoryActionDto>>(`server/files/copy`, {
      source,
      dest,
    });
  }

  async postServerFilesZip(login: LoginDto, items: string[], dest: string, store_only: boolean) {
    return this.createClient(login).post<ResultDto<ServerFileZipActionDto>>(`server/files/zip`, {
      items,
      store_only,
      dest,
    });
  }

  async getServerFilesDownload(login: LoginDto, root: string, filename: string) {
    return await this.createClient(login).get<NodeJS.ReadableStream>(`server/files/${root}/${filename}`, {
      responseType: "stream",
    });
  }

  async getServerFilesDownloadChunk(
    login: LoginDto,
    root: string,
    filename: string,
    startBytes: number,
    endBytes: number,
  ) {
    return await this.createClient(login).get<string>(`server/files/${root}/${filename}`, {
      headers: {
        Range: `bytes=${startBytes}-${endBytes}`,
      },
    });
  }

  async postServerFileUpload(
    login: LoginDto,
    stream: NodeJS.ReadableStream,
    fileName: string,
    contentLength: number,
    startPrint: boolean,
    progressToken?: string,
    root?: string,
    path?: string,
    checksum?: string,
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
    if (startPrint) {
      formData.append("print", "true");
    }

    formData.append("file", stream, { filename: fileName, knownLength: contentLength });

    // Calculate the header that axios uses to determine progress
    const result: number = await new Promise<number>((resolve, reject) => {
      return formData.getLength((err, length) => {
        if (err) reject(new Error("Could not retrieve formData length"));
        resolve(length);
      });
    });

    try {
      const response = await this.createClient(login, (b) => {
        b.withMultiPartFormData()
          .withTimeout(this.settingsStore.getTimeoutSettings().apiUploadTimeout)
          .withHeaders({
            ...formData.getHeaders(),
            "Content-Length": result.toString(),
          })
          .withOnUploadProgress((p) => {
            if (progressToken) {
              this.eventEmitter2.emit(`${uploadProgressEvent(progressToken)}`, progressToken, p);
            }
          });
      }).post(`server/files/upload`, formData);

      if (progressToken) {
        this.eventEmitter2.emit(`${uploadDoneEvent(progressToken)}`, progressToken);
      }

      return response.data;
    } catch (e: any) {
      if (progressToken) {
        this.eventEmitter2.emit(`${uploadFailedEvent(progressToken)}`, progressToken, (e as AxiosError)?.message);
      }
      let data;
      try {
        data = JSON.parse(e.response?.body);
      } catch {
        data = e.response?.body;
      }
      throw new ExternalServiceError(
        {
          error: e.message,
          statusCode: e.response?.statusCode,
          data,
          success: false,
          stack: e.stack,
        },
        "Moonraker",
      );
    }
  }

  async deleteServerFile(login: LoginDto, root: string, path: string) {
    const url = `server/files/${root}/${path}`;
    return this.createClient(login).delete<ResultDto<ServerFileDirectoryActionDto>>(url);
  }

  async getServerFileKlippyLogDownload(login: LoginDto) {
    return this.createClient(login).get<string>(`server/files/klippy.log`);
  }

  async getServerFileMoonrakerLogDownload(login: LoginDto) {
    return this.createClient(login).get<string>(`server/files/moonraker.log`);
  }

  async postAccessLoginUser(
    login: LoginDto,
    username: string,
    password: string,
    source: "ldap" | "moonraker" = "moonraker",
  ) {
    return this.createClient(login).post<ResultDto<AccessLoginResultDto>>("/access/login", {
      username,
      password,
      source,
    });
  }

  async postAccessLogoutUser(login: LoginDto) {
    // requires a bearer mechanism
    return this.createClient(login).post<ResultDto<AccessUserResultDto>>(`access/logout`);
  }

  async getAccessUser(login: LoginDto) {
    // requires a bearer mechanism
    return this.createClient(login).get<ResultDto<AccessUserDto>>(`access/user`);
  }

  async postAccessCreateUser(login: LoginDto, username: string, password: string) {
    return this.createClient(login).post<ResultDto<AccessLoginResultDto>>(`access/login`, {
      username,
      password,
    });
  }

  async deleteAccessUser(login: LoginDto, username: string) {
    return this.createClient(login).delete<ResultDto<AccessUserResultDto>>(`access/user`, {
      data: {
        username,
      },
    });
  }

  async listAccessUsers(login: LoginDto) {
    // requires a bearer mechanism
    return this.createClient(login).get<ResultDto<AccessUserDto[]>>(`access/user/list`);
  }

  async postAccessResetPassword(login: LoginDto, refresh_token: string) {
    return this.createClient(login).post<ResultDto<AccessLoginRefreshDto>>(`access/refresh_jwt`, {
      refresh_token,
    });
  }

  async getAccessOneshotToken(login: LoginDto) {
    return this.createClient(login).get<ResultDto<string>>(`access/oneshot_token`);
  }

  async getAccessInfo(login: LoginDto) {
    return this.createClient(login).get<ResultDto<AccessInfoDto>>(`access/info`);
  }

  async getAccessApiKey(login: LoginDto) {
    return this.createClient(login).get<ResultDto<string>>(`access/api_key`);
  }

  async postAccessApiKeyCreate(login: LoginDto) {
    return this.createClient(login).post<ResultDto<string>>(`access/api_key`);
  }

  async getDatabaseNamespaceList(login: LoginDto) {
    return this.createClient(login).get<ResultDto<DatabaseNamespaceListDto>>(`database/list`);
  }

  async getDatabaseNamespaceItem(login: LoginDto, namespace: Namespaces, key: string) {
    return this.createClient(login).get<ResultDto<DatabaseNamespaceItemDto>>(
      `database/item?namespace=${namespace}&key=${key}`,
    );
  }

  async postDatabaseNamespaceItem(
    login: LoginDto,
    namespace: Namespaces,
    key: string,
    value: any,
    typeHint?: "int" | "str" | "bool" | "json",
  ) {
    const typeHintParam = typeHint?.length ? `:${typeHint}` : "";
    return this.createClient(login).post<ResultDto<DatabaseNamespaceItemDto>>(
      `database/item?namespace=${namespace}&key=${key}&value${typeHintParam}=${value}`,
    );
  }

  async deleteDatabaseNamespaceItem(login: LoginDto, namespace: Namespaces, key: string) {
    return this.createClient(login).delete<ResultDto<DatabaseNamespaceItemDto>>(
      `database/item?namespace=${namespace}&key=${key}`,
    );
  }

  async getJobQueueStatus(login: LoginDto) {
    return this.createClient(login).get<ResultDto<JobQueueStatusDto>>(`job_queue/status`);
  }

  async postJobQueueJob(login: LoginDto, filenames: string[], reset: boolean) {
    // Alternatively param based with comma separated filenames: "POST /server/job_queue/job?filenames=job1.gcode,job2.gcode,subdir/job3.gcode"
    return this.createClient(login).post<
      ResultDto<JobQueueStatusDto>,
      AxiosResponse<ResultDto<JobQueueStatusDto>>,
      EnqueueJobDto
    >(`job_queue/job`, {
      filenames,
      reset,
    });
  }

  async deleteJobQueueJob(login: LoginDto, jobIds: string[], all?: boolean) {
    const base = `job_queue/job`;
    const url = !!all ? `${base}?all=true` : `${base}?job_ids=${jobIds.join(",")}`;
    return this.createClient(login).delete<ResultDto<DatabaseNamespaceItemDto>>(url);
  }

  async postJobQueuePause(login: LoginDto) {
    return this.createClient(login).post<ResultDto<JobQueueStatusDto>>(`job_queue/pause`);
  }

  async postJobQueueStart(login: LoginDto) {
    return this.createClient(login).post<ResultDto<JobQueueStatusDto>>(`job_queue/start`);
  }

  async postJobQueueJump(login: LoginDto, jobId: string) {
    return this.createClient(login).post<ResultDto<JobQueueStatusDto>>(`job_queue/jump?job_id=${jobId}`);
  }

  async getAnnouncementsList(login: LoginDto, includeDismissed: boolean) {
    return this.createClient(login).get<ResultDto<AnnouncementListDto>>(
      `server/announcements/list?include_dismissed=${includeDismissed}`,
    );
  }

  async postAnnouncementsUpdate(login: LoginDto) {
    return this.createClient(login).post<ResultDto<AnnouncementListDto>>(`server/announcements/update`);
  }

  /**
   *
   * @param login
   * @param entryId The entry identifier (name). This field may contain forward slashes, so it should be url escaped when placed in the query string of an http request. This parameter is required.
   * @param wakeTime The time, in seconds, in which the entry's dismissed state will revert to false. This parameter is optional, if omitted the entry will be dismissed indefinitely.
   */
  async postAnnouncementsDismiss(login: LoginDto, entryId: string, wakeTime: number) {
    return this.createClient(login).post<ResultDto<AnnouncementEntryIdDto>>(
      `server/announcements/dismiss?entry_id=${encodeURIComponent(entryId)}&wake_time=${wakeTime}`,
    );
  }

  async getAnnouncementsFeeds(login: LoginDto) {
    return this.createClient(login).get<ResultDto<AnnouncementFeedsDto>>(`server/announcements/feeds`);
  }

  async postAnnouncementsFeedAdd(login: LoginDto, name: string) {
    return this.createClient(login).get<ResultDto<AnnouncementActionDto>>(`server/announcements/feeds?name=${name}`);
  }

  async deleteAnnouncementsFeedRemove(login: LoginDto, name: string) {
    return this.createClient(login).delete<ResultDto<AnnouncementActionDto>>(`server/announcements/feeds?name=${name}`);
  }

  async getWebcamList(login: LoginDto) {
    return this.createClient(login).get<ResultDto<WebcamListDto>>(`server/webcams/list`);
  }

  async getWebcamItem(login: LoginDto, uid?: string, name?: string) {
    const base = `server/webcams/get_item`;
    const url = !!uid?.length ? `${base}?uid=${uid}` : `${base}?name=${name}`;
    return this.createClient(login).get<ResultDto<WebcamItemDto>>(url);
  }

  async postWebcamItemUpdate(login: LoginDto, webcam: Omit<WebcamDto, "source">) {
    return this.createClient(login).post<ResultDto<WebcamItemDto>>(`server/webcams/post_item`, webcam);
  }

  async deleteWebcamItem(login: LoginDto, uid?: string, name?: string) {
    const base = `server/webcams/delete_item`;
    const url = !!uid?.length ? `${base}?uid=${uid}` : `${base}?name=${name}`;
    return this.createClient(login).get<ResultDto<WebcamItemDto>>(url);
  }

  async postWebcamTest(login: LoginDto, uid?: string, name?: string) {
    const base = `server/webcams/test`;
    const url = !!uid?.length ? `${base}?uid=${uid}` : `${base}?name=${name}`;
    return this.createClient(login).get<ResultDto<WebcamTestDto>>(url);
  }

  async getNotifierList(login: LoginDto) {
    return this.createClient(login).get<ResultDto<NotifierListDto>>(`server/notifiers/list`);
  }

  async postMachineUpdateStatus(login: LoginDto) {
    // Refresh parameter is deprecated over refresh endpoint
    return this.createClient(login).post<ResultDto<MachineUpdateStatusDto>>(`machine/update/status`);
  }

  async postMachineUpdateRefresh(login: LoginDto, name?: string | "moonraker" | "klipper") {
    const base = `machine/update/refresh`;
    const url = !!name ? `${base}` : `${base}?name=${name}`;
    return this.createClient(login).post<ResultDto<MachineUpdateStatusDto>>(url);
  }

  async postMachineUpdateFull(login: LoginDto) {
    // Order
    // system if enabled
    // All configured clients
    // Klipper
    // Moonraker
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/update/full`);
  }

  async postMachineUpdateMoonraker(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/update/moonraker`);
  }

  async postMachineUpdateKlipper(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/update/klipper`);
  }

  async postMachineUpdateClient(login: LoginDto, name: string) {
    // [update_manager client client_name] sections (in config)
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/update/client?name=${name}`);
  }

  async postMachineUpdateSystem(login: LoginDto) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/update/system`);
  }

  async postMachineUpdateRecover(login: LoginDto, name?: string | "moonraker" | "klipper", hard: boolean = false) {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(
      `machine/update/recover?name=${name}&hard=${hard}`,
    );
  }

  async postMachineUpdateRollback(login: LoginDto, name?: string | "moonraker" | "klipper") {
    return this.createClient(login).post<ResultDto<ActionResultDto>>(`machine/update/rollback?name=${name}`);
  }

  async getMachineDevicePowerDevices(login: LoginDto) {
    return this.createClient(login).get<ResultDto<MachineDevicePowerDevicesDto>>(`machine/device_power/devices`);
  }

  async getMachineDevicePowerDeviceState(login: LoginDto, device: string) {
    return this.createClient(login).get<ResultDto<MachineDevicePowerDeviceStateDto>>(
      `machine/device_power/device?device=${device}`,
    );
  }

  async postMachineDevicePowerDeviceState(login: LoginDto, device: string, action: "on" | "off" | "toggle") {
    return this.createClient(login).post<ResultDto<MachineDevicePowerDeviceStateDto>>(
      `machine/device_power/device?device=${device}&action=${action}`,
    );
  }

  async getMachineDevicePowerBatchDeviceState(login: LoginDto, devices: string[]) {
    return this.createClient(login).get<ResultDto<MachineDevicePowerDeviceStateDto>>(
      `machine/device_power/status?${devices.join("&")}`,
    );
  }

  async postMachineDevicePowerBatchPowerOn(login: LoginDto, device: string) {
    return this.createClient(login).post<ResultDto<MachineDevicePowerDeviceStateDto>>(
      `machine/device_power/on?device=${device}`,
    );
  }

  async postMachineDevicePowerBatchPowerOff(login: LoginDto, device: string) {
    return this.createClient(login).post<ResultDto<MachineDevicePowerDeviceStateDto>>(
      `machine/device_power/off?device=${device}`,
    );
  }

  async getMachineWledStrips(login: LoginDto) {
    return this.createClient(login).get<ResultDto<MachineWledStripsDto>>(`machine/wled/strips`);
  }

  async getMachineWledStatuses(login: LoginDto, strips: string[]) {
    return this.createClient(login).get<ResultDto<MachineWledStripsDto>>(`machine/wled/status?${strips.join("&")}`);
  }

  async postMachineWledPowerOn(login: LoginDto, strips: string[]) {
    return this.createClient(login).post<ResultDto<MachineWledStripsDto>>(`machine/wled/on?${strips.join("&")}`);
  }

  async postMachineWledPowerOff(login: LoginDto, strips: string[]) {
    return this.createClient(login).post<ResultDto<MachineWledStripsDto>>(`machine/wled/off?${strips.join("&")}`);
  }

  async postMachineWledPowerStripAction(login: LoginDto, strips: string[]) {
    return this.createClient(login).post<ResultDto<MachineWledStripsDto>>(`machine/wled/toggle?${strips.join("&")}`);
  }

  async getMachineWledStripAction(
    login: LoginDto,
    strip: string,
    action: "control" | "on" | "off",
    controlParams: Record<string, number>,
  ) {
    const queryParams = Object.entries(controlParams)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return this.createClient(login).get<ResultDto<MachineWledStripsDto>>(
      `machine/wled/strip?strip=${strip}&action=${action}&${queryParams}`,
    );
  }

  async getServerSensorsList(login: LoginDto) {
    return this.createClient(login).get<ResultDto<SensorListDto>>(`server/sensors/list`);
  }

  async getServerSensorItem(login: LoginDto, sensor: string) {
    return this.createClient(login).get<ResultDto<SensorDto>>(`server/sensors/info?sensor=${sensor}`);
  }

  async getServerSensorMeasurements(login: LoginDto, sensor: string) {
    return this.createClient(login).get<ResultDto<SensorsMeasurementsDto>>(
      `server/sensors/measurements?sensor=${sensor}`,
    );
  }

  async getServerSensorMeasurementsBatch(login: LoginDto) {
    return this.createClient(login).get<ResultDto<SensorsMeasurementsDto>>(`server/sensors/measurements`);
  }

  async getServerSpoolmanStatus(login: LoginDto) {
    return this.createClient(login).get<ResultDto<SpoolmanStatusDto>>(`server/spoolman/status`);
  }

  async postServerSpoolmanActiveSpool(login: LoginDto, spoolId: number) {
    return this.createClient(login).post<ResultDto<SpoolmanActiveSpoolDto>>(`server/spoolman/spool_id`, {
      spool_id: spoolId,
    });
  }

  async getServerSpoolmanActiveSpool(login: LoginDto) {
    return this.createClient(login).get<ResultDto<SpoolmanActiveSpoolDto>>(`server/spoolman/spool_id`);
  }

  async postServerSpoolmanProxyRequest<I, O>(login: LoginDto, body?: SpoolmanProxyRequestDto<I>) {
    // Spoolman v1 will not wrap responses! Errors are proxied directly.
    return this.createClient(login).post<
      SpoolmanResponseDto<O>,
      AxiosResponse<SpoolmanResponseDto<O>>,
      SpoolmanProxyRequestDto<I>
    >(`server/spoolman/proxy`, body);
  }

  /**
   * @description API might not be available in the future
   * @param login
   */
  async getApiVersion(login: LoginDto) {
    return this.createClient(login).get<ApiVersionDto>(`api/version`);
  }

  /**
   * @description API might not be available in the future
   * @param login
   */
  async getServerVersion(login: LoginDto) {
    return this.createClient(login).get<ServerVersionDto>(`api/server`);
  }

  /**
   * @description API might not be available in the future
   * @param login
   */
  async getApiLogin(login: LoginDto) {
    return this.createClient(login).get<ApiLoginDto>(`api/login`);
  }

  /**
   * @deprecated API might not be available in the future
   * @param login
   */
  async getApiSettings(login: LoginDto) {
    return this.createClient(login).get<ApiSettingsDto>(`api/settings`);
  }

  /**
   * @deprecated API might not be available in the future
   * @param login
   */
  async getApiJob(login: LoginDto) {
    return this.createClient(login).get<ApiJobDto>(`api/job`);
  }

  /**
   * @deprecated API might not be available in the future
   * @param login
   */
  async getApiPrinter(login: LoginDto) {
    return this.createClient(login).get<ApiPrinterDto>(`api/printer`);
  }

  /**
   * @deprecated API might not be available in the future
   * @param login
   * @param commands
   */
  async postApiPrinterCommand(login: LoginDto, commands: string[]) {
    return this.createClient(login).post<{}>(`api/command`, {
      commands,
    });
  }

  /**
   * @deprecated API might not be available in the future
   * @param login
   */
  async getApiProfiles(login: LoginDto) {
    return this.createClient(login).get<ApiProfilesDto>(`api/printerprofiles`);
  }

  async getServerHistoryList(
    login: LoginDto,
    limit: number,
    start: number,
    since?: number,
    before?: number,
    order: "asc" | "desc" = "desc",
  ) {
    let params = `limit=${limit}&start=${start}&order=${order}`;
    if (!!before || before === 0) {
      params += "&before=" + before;
    }
    if (!!since || since === 0) {
      params += "&since=" + since;
    }
    return this.createClient(login).get<ResultDto<HistoryListDto>>(`server/history/list?${params}`);
  }

  async getServerHistoryTotals(login: LoginDto) {
    return this.createClient(login).get<ResultDto<HistoryTotalsDto>>(`server/history/totals`);
  }

  async postServerHistoryResetTotals(login: LoginDto) {
    return this.createClient(login).post<ResultDto<HistoryLastTotalsDto>>(`server/history/reset_totals`);
  }

  async getServerHistoryJob(login: LoginDto, uid: string) {
    return this.createClient(login).get<ResultDto<HistoryJobDto>>(`server/history/job?uid=${uid}`);
  }

  async deleteServerHistoryJob(login: LoginDto, uid?: string) {
    const base = `server/history/job`;
    const url = !!uid?.length ? `${base}?uid=${uid}` : `${base}?all=true`;
    return this.createClient(login).get<ResultDto<string[]>>(url);
  }

  private convertToQueryString(query: Partial<Record<KnownPrinterObject, string[]>>): string {
    return Object.entries(query)
      .reduce((acc: string[], [key, value]) => {
        if (value.length > 0) {
          acc.push(`${key}=${value.join(",")}`);
        } else {
          acc.push(key);
        }
        return acc;
      }, [])
      .join("&");
  }

  private createClient(login: LoginDto, buildFluentOptions?: (base: DefaultHttpClientBuilder) => void) {
    const baseAddress = login.printerURL;

    return this.createAnonymousClient(baseAddress, (o) => {
      if (buildFluentOptions) {
        buildFluentOptions(o);
      }
    });
  }

  private createAnonymousClient(baseAddress: string, buildFluentOptions?: (base: DefaultHttpClientBuilder) => void) {
    const builder = new DefaultHttpClientBuilder();

    return this.httpClientFactory.createClientWithBaseUrl(builder, baseAddress, (b) => {
      if (buildFluentOptions) {
        buildFluentOptions(b);
      }
    });
  }
}
