export enum Message {
  CONNECTED = "connected",
  REAUTHREQUIRED = "reauthRequired",
  CURRENT = "current",
  HISTORY = "history",
  EVENT = "event",
  PLUGIN = "plugin",
  TIMELAPSE = "timelapse",
  SLICINGPROCESS = "slicingProgress",

  // Custom events
  WS_OPENED = "WS_OPENED",
  WS_CLOSED = "WS_CLOSED",
  WS_ERROR = "WS_ERROR",
}

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
 * @param octoPrintResponse
 * @returns {boolean}
 */
export function isLoginResponseGlobal(octoPrintResponse) {
  // Explicit nullability check serves to let an unconnected printer fall through as well as incorrect apiKey
  return !!octoPrintResponse && octoPrintResponse.name === "_api";
}

export function constructHeaders(apiKey, contentType = jsonContentType) {
  return {
    [contentTypeHeaderKey]: contentType, // Can be overwritten without problem
    [apiKeyHeaderKey]: apiKey,
  };
}
