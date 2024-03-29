// https://github.com/OctoPrint/OctoPrint/blob/161e21fe0f6344ec3b9b9b541e9b2c472087ba77/src/octoprint/util/comm.py#L913
export const OP_STATE = {
  Offline: "Offline",
  OpeningSerial: "Opening serial connection",
  DetectingSerial: "Detecting serial connection",
  Connecting: "Connecting",
  Operational: "Operational",
  StartingPrintFromSD: "Starting print from SD", // Starting
  StartSendingPrintToSD: "Starting to send file to SD", // Starting
  Starting: "Starting", // Starting
  TransferringFileToSD: "Transferring file to SD", // Transferring
  PrintingFromSD: "Printing from SD", // Printing
  SendingFileToSD: "Sending file to SD", // Printing
  Printing: "Printing", // Printing,
  Cancelling: "Cancelling",
  Pausing: "Pausing",
  Paused: "Paused",
  Resuming: "Resuming",
  Finishing: "Finishing",
  Error: "Error",
  OfflineAfterError: "Offline after error",
  UnknownState: "Unknown State ()", // Unknown State (...) needs proper parsing
};

export const pluginManagerCommands = {
  install: {
    name: "install",
    param: "url",
  },
  uninstall: {
    name: "install",
    param: "plugin",
  },
  enable: {
    name: "enable",
    param: "plugin",
  },
  disable: {
    name: "disable",
    param: "plugin",
  },
  cleanup: {
    name: "cleanup",
    param: "plugin",
  },
  cleanup_all: {
    name: "cleanup_all",
    param: undefined,
  },
  refresh_repository: {
    name: "refresh_repository",
    param: undefined,
  },
};

export const pluginRepositoryUrl = "https://plugins.octoprint.org/plugins.json";

export const contentTypeHeaderKey = "content-type";
export const apiKeyHeaderKey = "x-api-key";
export const jsonContentType = "application/json";
export const multiPartContentType = "multipart/form-data";

/**
 * Predicate to check whether login is global type (Global API Key) which would be problematic
 */
export function isLoginResponseGlobal(octoPrintResponse): boolean {
  // Explicit nullability check serves to let an unconnected printer fall through as well as incorrect apiKey
  // Note: 'apikey' property is conform OctoPrint response (and not FDM Monster printer model's 'apiKey')
  return !!octoPrintResponse && octoPrintResponse.name === "_api";
}
