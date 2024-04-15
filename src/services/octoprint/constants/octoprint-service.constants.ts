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
