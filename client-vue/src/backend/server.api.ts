export class ServerApi {
  static base = "api";
  static amIAliveRoute = ServerApi.base + "/amialive";
  static printerRoute = ServerApi.base + "/printer";
  static printerBatchRoute = `${ServerApi.printerRoute}/batch`;
  static printerTestConnectionRoute = `${ServerApi.printerRoute}/test-connection`;
  static printerSettingsRoute = ServerApi.base + "/printer-settings";
  static printerGroupRoute = ServerApi.base + "/printer-group";
  static printerGroupSyncLegacyRoute = `${ServerApi.printerGroupRoute}/sync-legacy`;
  static printerFilesRoute = `${ServerApi.base}/printer-files`;
  static printerFilesUploadStubRoute = `${ServerApi.base}/printer-files/upload-stub`;
  static printerFilesPurgeRoute = `${ServerApi.printerFilesRoute}/purge`;
  static printerNetworkRoute = `${ServerApi.base}/printer-network`;
  static scanSsdp = `${ServerApi.printerNetworkRoute}/scan-ssdp`;
  static settingsRoute = `${ServerApi.base}/settings`;
  static serverSettingsRoute = `${ServerApi.settingsRoute}/server`;
  static serverLogsRoute = `${ServerApi.serverSettingsRoute}/logs`;
  static generateLogsDumpRoute = `${ServerApi.serverLogsRoute}/generate-log-dump`;
  static serverRestartRoute = `${ServerApi.serverSettingsRoute}/restart`;
  static clientSettingsRoute = `${ServerApi.settingsRoute}/client`;
  static customGCodeSettingsRoutes = `${ServerApi.settingsRoute}/custom-gcode`;
  static clientRoute = `${ServerApi.base}/client`;
  static clientFilterRoute = `${ServerApi.clientRoute}/filter`;
  static clientSortingRoute = `${ServerApi.clientRoute}/sorting`;
  static historyRoute = `${ServerApi.base}/history`;
  static historyStatsRoute = `${ServerApi.historyRoute}/stats`;
  static filamentRoute = `${ServerApi.base}/filament`;
  static filamentProfilesRoute = `${ServerApi.filamentRoute}/profiles`;
  static filamentSpoolsRoute = `${ServerApi.filamentRoute}/spools`;
  static filamentSelectRoute = `${ServerApi.filamentRoute}/select`;
  static alertRoute = `${ServerApi.base}/alert`;
  static testAlertScriptRoute = `${ServerApi.alertRoute}/test-alert-script`;

  static getPrinterRoute = (id: string) => `${ServerApi.printerRoute}/${id}`;
  static getPrinterSettingsRoute = (id: string) => `${ServerApi.printerSettingsRoute}/${id}`;
  static setPrinterSettingsGCodeAnalysisRoute = (id: string) =>
    `${ServerApi.getPrinterSettingsRoute(id)}/gcode-analysis`;
  static getPrinterGroupRoute = (id: string) => `${ServerApi.printerGroupRoute}/${id}`;
  static updatePrinterGroupNameRoute = (id: string) => `${ServerApi.getPrinterGroupRoute(id)}/name`;
  static printerFilesClearRoute = (id: string) => `${ServerApi.printerFilesRoute}/${id}/clear`;
  static printerFilesSelectAndPrintRoute = (id: string) =>
    `${ServerApi.printerFilesRoute}/${id}/select`;
  static printerFilesUploadRoute = (id: string) => `${ServerApi.printerFilesRoute}/${id}/upload`;
  static printerFilesCacheRoute = (id: string) => `${ServerApi.printerFilesRoute}/${id}/cache`;
  static printerEnabledRoute = (id: string) => `${ServerApi.getPrinterRoute(id)}/enabled`;
  static printerSerialConnectRoute = (id: string) =>
    `${ServerApi.getPrinterRoute(id)}/serial-connect`;
  static printerSerialDisconnectRoute = (id: string) =>
    `${ServerApi.getPrinterRoute(id)}/serial-disconnect`;

  static printerJobRoute = (id: string) => `${ServerApi.getPrinterRoute(id)}/job`;
  static printerStopJobRoute = (id: string) => `${ServerApi.printerJobRoute(id)}/stop`;
}
