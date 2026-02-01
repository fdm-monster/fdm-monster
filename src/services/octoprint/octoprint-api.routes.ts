export class OctoprintRoutes {
  octoPrintBase = "/";
  apiBase = `${this.octoPrintBase}api`;
  apiVersion = `${this.apiBase}/version`;
  apiServer = `${this.apiBase}/server`;
  apiCurrentUser = `${this.apiBase}/currentuser`;
  apiSettingsPart = `${this.apiBase}/settings`;
  apiFiles = `${this.apiBase}/files`;
  apiFilesLocal = `${this.apiFiles}/local`;
  apiConnection = `${this.apiBase}/connection`;
  apiJob = `${this.apiBase}/job`;
  apiPrinter = `${this.apiBase}/printer`;
  apiPrinterHead = `${this.apiBase}/printer/printhead`;
  apiPrinterBed = `${this.apiPrinter}/bed`;
  apiPrinterCustomCommand = `${this.apiPrinter}/command`;
  apiPrinterProfiles = `${this.apiBase}/printerprofiles`;
  apiSystem = `${this.apiBase}/system`;
  apiSystemInfo = `${this.apiSystem}/info`;
  apiSystemCommands = `${this.apiSystem}/commands`;
  apiServerRestartCommand = `${this.apiSystemCommands}/core/restart`;
  apiUsers = `${this.apiBase}/users`;
  apiLogin = `${this.apiBase}/login`;

  get disconnectCommand() {
    return { command: "disconnect" };
  }

  get cancelJobCommand() {
    return { command: "cancel" };
  }

  get pauseJobCommand() {
    return { command: "pause", action: "pause" };
  }

  get resumeJobCommand() {
    return { command: "pause", action: "resume" };
  }

  get connectCommand() {
    return { command: "connect" };
  }

  getBedTargetCommand(targetTemperature: number) {
    return { command: "target", target: targetTemperature };
  }

  apiPrinterCurrent = (history?: boolean, limit?: number, exclude?: ("temperature" | "sd" | "state")[]) => {
    exclude = exclude?.filter((e) => !!e.length);
    const excludeParam = exclude?.length ? `&exclude=${exclude?.join(",")}` : "";
    const limitParam = !!limit ? `&limit=${limit}` : "";
    return `${this.apiPrinter}?history=${!!history}${limitParam}${excludeParam}`;
  };

  apiFile = (path: string) => `${this.apiFilesLocal}/${path}`;

  downloadFileLocal = (path: string) => `${this.octoPrintBase}downloads/files/local/${path}`;

  apiGetFiles = (recursive = false, path = "") => `${this.apiFiles}/local${path ? `/${path}` : ''}?recursive=${recursive}`;

  selectCommand(print = false) {
    return { command: "select", print };
  }

  moveFileCommand(destination: string) {
    return { command: "move", destination };
  }

  printerNameSetting(name: string) {
    return {
      appearance: {
        name: name,
      },
    };
  }
}
