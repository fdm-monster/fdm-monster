export class ServerApi {
  public static readonly base = "api";
  public static readonly amIAliveRoute = ServerApi.base + "/amialive";
  public static readonly printerRoute = ServerApi.base + "/printer";
  public static readonly printerEnabledRoute = (id: string) =>
    ServerApi.printerRoute + `/${id}/enabled`;
  static printerFilesRoute = ServerApi.base + "/printer-files";
  public static readonly printerNetworkRoute = ServerApi.base + "/printer-network";
  public static readonly scanSsdp = ServerApi.printerNetworkRoute + "/scan-ssdp";
  public static readonly settingsRoute = ServerApi.base + "/settings";
  public static readonly serverSettingsRoute = ServerApi.settingsRoute + "/server";
  public static serverLogsRoute = `${ServerApi.serverSettingsRoute}/logs`;
  public static generateLogsDumpRoute = `${ServerApi.serverLogsRoute}/generate-log-dump`;
  public static serverRestartRoute = `${ServerApi.serverSettingsRoute}/restart`;
  public static clientSettingsRoute = ServerApi.settingsRoute + "/client";
  public static customGCodeSettingsRoutes = ServerApi.settingsRoute + "/custom-gcode";
  public static clientRoute = ServerApi.base + "/client";
  public static clientFilterRoute = ServerApi.clientRoute + "/filter";
  public static clientSortingRoute = ServerApi.clientRoute + "/sorting";
  public static historyRoute = ServerApi.base + "/history";
  public static historyStatsRoute = ServerApi.historyRoute + "/stats";
  public static filamentRoute = ServerApi.base + "/filament";
  public static filamentDropdownListRoute = ServerApi.filamentRoute + "/dropDownList";
  public static filamentProfilesRoute = ServerApi.filamentRoute + "/profiles";
  public static filamentSpoolsRoute = ServerApi.filamentRoute + "/spools";
  public static filamentSelectRoute = ServerApi.filamentRoute + "/select";
  public static filamentManagerRoute = ServerApi.filamentRoute + "/filament-manager";
  public static filamentManagerReSyncRoute = ServerApi.filamentManagerRoute + "/resync";
  public static filamentManagerSyncRoute = ServerApi.filamentManagerRoute + "/sync";
  public static filamentManagerDisableRoute = ServerApi.filamentManagerRoute + "/disable";
  public static alertRoute = ServerApi.base + "/alert";
  public static testAlertScriptRoute = ServerApi.alertRoute + "/test-alert-script";
  public static roomDataRoute = ServerApi.base + "/room-data";
}
