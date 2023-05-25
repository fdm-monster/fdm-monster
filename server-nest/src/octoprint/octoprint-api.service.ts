import { Injectable } from "@nestjs/common";
import { OctoPrintSettingsDto } from "./dto/octoprint-settings.dto";
import { PrinterLoginDto } from "@/shared/dtos/printer-login.dto";
import { OctoPrintCurrentUserDto } from "./dto/octoprint-currentuser.dto";
import { OctoPrintSessionDto } from "./dto/octoprint-session.dto";
import { OctoPrintClientRoutes } from "@/octoprint/octoprint-api-routes.definition";
import { OctoPrintHttpService } from "@/octoprint/octoprint-http.service";
import { map, tap } from "rxjs/operators";
import { OctoPrintFileDto } from "@/octoprint/dto/octoprint-file.dto";
import * as FormData from "form-data";
import { createReadStream, ReadStream } from "fs";
import { multiPartContentType, pluginRepositoryUrl } from "@/octoprint/octoprint.constants";
import { HttpService } from "@nestjs/axios";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import got, { Progress } from "got-cjs";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { uploadProgressEvent } from "@/app.constants";
import { OctoPrintFilesDto } from "@/octoprint/dto/octoprint-files.dto";

export type PartialMulterFile = { path: string; buffer?: Buffer; originalname: string };

@Injectable()
export class OctoPrintApiService extends OctoPrintClientRoutes {
  constructor(private httpCore: HttpService, private http: OctoPrintHttpService, private eventEmitter: EventEmitter2) {
    super();
  }

  //region Login & Users
  login(login: PrinterLoginDto) {
    return this.http.post<OctoPrintSessionDto>(login, this.apiLogin);
  }

  getAdminUserOrDefault(login: PrinterLoginDto) {
    return this.getUsers(login).pipe(
      map((data: { users: any[] }) => {
        let opAdminUserName = "admin";
        const users = data?.users;
        if (users?.length) {
          const adminUser = users.find((user) => !!user.admin);
          if (!!adminUser) opAdminUserName = adminUser.name;
        }

        return opAdminUserName;
      })
    );
  }

  getUsers(login: PrinterLoginDto) {
    // TODO type
    return this.http.get<{ users: any[] }>(login, this.apiUsers);
  }

  getCurrentUser(login: PrinterLoginDto) {
    return this.http.get<OctoPrintCurrentUserDto>(login, this.apiCurrentUser);
  }

  //endregion

  //region Settings
  getSettings(login: PrinterLoginDto) {
    return this.http.get<OctoPrintSettingsDto>(login, this.apiSettings);
  }

  setCORSEnabled(login: PrinterLoginDto) {
    const body = this.corsAccess();
    return this.http.post<OctoPrintSettingsDto>(login, this.apiSettings, body);
  }

  setPrinterName(login: PrinterLoginDto, name: string) {
    const body = this.nameSetting(name);
    return this.http.post<OctoPrintSettingsDto>(login, this.apiSettings, body);
  }

  disableGCodeAnalysis(login: PrinterLoginDto, disabled = true) {
    const body = this.gcodeAnalysisSetting(!disabled);
    return this.http.post<OctoPrintSettingsDto>(login, this.apiSettings, body);
  }

  configFirmwarePlugin(login: PrinterLoginDto, body: any) {
    return this.http.post<OctoPrintSettingsDto>(login, this.apiSettings, body);
  }

  //endregion

  //region Printer Commands
  getConnection(login: PrinterLoginDto) {
    return this.http.get(login, this.apiConnection);
  }

  connectSerial(login: PrinterLoginDto, connect: boolean) {
    const command = connect ? this.connectCommand : this.disconnectCommand;
    return this.http.post<any>(login, this.apiConnection, command);
  }

  sendM112GCode(login: PrinterLoginDto) {
    return this.sendCustomGCode(login, "M112");
  }

  sendCustomGCode(login: PrinterLoginDto, commandString: string) {
    return this.http.post<any>(login, this.apiPrinterCustomCommand, { command: commandString });
  }

  sendCustomGCodeCommands(login: PrinterLoginDto, commands: string[]) {
    return this.http.post<any>(login, this.apiPrinterCustomCommand, { commands });
  }

  cancelJob(login: PrinterLoginDto) {
    return this.http.post<any>(login, this.apiJob, this.cancelJobCommand);
  }

  setBedTemp(login: PrinterLoginDto, targetTemp: number) {
    return this.http.post<any>(login, this.apiPrinterBed, this.getBedTargetCommand(targetTemp));
  }

  //endregion

  //region Files
  getFiles(login: PrinterLoginDto, recursive: boolean = false) {
    return this.http.get<OctoPrintFilesDto>(login, this.apiGetFiles(recursive));
  }

  getFile(login: PrinterLoginDto, filePath: string) {
    return this.http.get<OctoPrintFileDto>(login, this.apiFile(filePath));
  }

  downloadFile(login: PrinterLoginDto, filePath: string) {
    return this.http.getPipe(login, this.downloadLocalFilePath(filePath));
  }

  createFolder(login: PrinterLoginDto, path: string, folderName: string) {
    const formData = new FormData();
    formData.append("path", path);
    formData.append("foldername", folderName);

    const extraHeaders = {
      ...formData.getHeaders(),
      "Content-Length": formData.getLengthSync(),
    };
    // Why formData as body as well? Just because?
    return this.http.post(login, this.apiFilesLocation, formData, extraHeaders);
  }

  moveFileOrFolder(login: PrinterLoginDto, path: string, destination: string) {
    const body = this.moveFileCommand(destination);
    return this.http.post<any>(login, this.apiFile(path), body);
  }

  deleteFileOrFolder(login: PrinterLoginDto, path: string) {
    return this.http.delete<any>(login, this.apiFile(path));
  }

  selectPrintFile(login: PrinterLoginDto, path: string, print: boolean) {
    const body = this.selectCommand(print);
    return this.http.post(login, this.apiFile(path), body);
  }

  uploadFile(login: PrinterLoginDto, multerFile: PartialMulterFile, commands, token, signal?: AbortSignal) {
    const formData = new FormData();
    if (commands.select) {
      formData.append("select", "true");
    }
    if (commands.print) {
      formData.append("print", "true");
    }
    let dataSource: Buffer | ReadStream = multerFile?.buffer ? multerFile.buffer : createReadStream(multerFile.path);
    formData.append("file", dataSource, { filename: multerFile.originalname });

    const promise = async () => {
      // Multipart header just to be certain
      const { url, headers } = await this.http.prepareRequest(
        login,
        this.apiFilesLocation,
        formData.getHeaders(),
        multiPartContentType
      );
      return got
        .post(url, {
          body: formData,
          headers,
          signal,
        })
        .on("uploadProgress", (p: Progress) => {
          this.eventEmitter.emit(`${uploadProgressEvent(token)}`, token, p);
        })
        .then((r) => {
          this.eventEmitter.emit(`${uploadProgressEvent(token)}`, token, { done: true });
          return r;
        })
        .catch((e) => {
          this.eventEmitter.emit(`${uploadProgressEvent(token)}`, token, { failed: true }, e);
          let data;
          try {
            data = JSON.parse(e.response?.body);
          } catch {
            data = e.response?.body;
          }
          throw {
            error: e.message,
            statusCode: e.response?.statusCode,
            data,
            success: false,
            stack: e.stack,
          };
        });
    };

    return fromPromise(promise()).pipe(
      tap((result) => {
        // TODO file cleanup
      }),
      map((response) => {
        return JSON.parse(response.body);
      })
    );
  }

  //endregion

  //region Plugins
  fetchOctoPrintPlugins() {
    // Does not perform an authenticated call
    return this.httpCore.get(pluginRepositoryUrl).pipe(map((result) => result.data));
  }

  getPluginFirmwareUpdateStatus(login: PrinterLoginDto) {
    return this.http.get(login, this.pluginFirmwareUpdaterStatus);
  }

  //endregion

  //region System
  getSystemInfo(login: PrinterLoginDto) {
    return this.http.get(login, this.apiSystemInfo);
  }

  getSystemCommands(login: PrinterLoginDto) {
    return this.http.get(login, this.apiSystemCommands);
  }

  restartOctoPrintCommand(login: PrinterLoginDto) {
    return this.http.post(login, this.apiSystemRestartCommand);
  }

  getSoftwareUpdateCheck(login: PrinterLoginDto, force: boolean) {
    return this.http.get(login, this.apiSoftwareUpdateCheck(force));
  }

  postSoftwareUpdate(login: PrinterLoginDto) {
    return this.http.post(login, this.pluginSoftwareUpdateUpdate);
  }

  getPluginManagerPlugins(login: PrinterLoginDto) {
    return this.http.get(login, this.pluginManagerPlugins);
  }

  getPluginManagerPlugin(login: PrinterLoginDto, pluginName: string) {
    return this.http.get(login, this.pluginManagerPlugin(pluginName));
  }

  postApiPluginManagerCommand(login: PrinterLoginDto, pluginCommand, pluginUrl) {
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    return this.http.post(login, this.apiPluginManager, command);
  }

  getPluginPiSupport(login: PrinterLoginDto) {
    return this.http.get(login, this.apiPluginPiSupport);
  }

  //endregion
}
