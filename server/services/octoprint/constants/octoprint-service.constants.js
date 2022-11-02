class OPClientErrors {
  static filamentIdNotANumber = "FilamentID provided was not numeric";

  static printerValidationErrorMessage = "printer apiKey or URL undefined";
}

const pluginManagerCommands = {
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

const pluginRepositoryUrl = "https://plugins.octoprint.org/plugins.json";

const contentTypeHeaderKey = "Content-Type";
const apiKeyHeaderKey = "X-Api-Key";
const jsonContentType = "application/json";
const multiPartContentType = "multipart/form-data";

/**
 * Predicate to check whether login is global type (Global API Key) which would be problematic
 * @param octoPrintResponse
 * @returns {boolean}
 */
function isLoginResponseGlobal(octoPrintResponse) {
  // Explicit nullability check serves to let an unconnected printer fall through as well as incorrect apiKey
  // Note: 'apikey' property is conform OctoPrint response (and not FDM Monster printer model's 'apiKey')
  return !!octoPrintResponse && octoPrintResponse.name === "_api";
}

module.exports = {
  OPClientErrors,
  contentTypeHeaderKey,
  apiKeyHeaderKey,
  jsonContentType,
  pluginRepositoryUrl,
  multiPartContentType,
  pluginManagerCommands,
  isLoginResponseGlobal,
};
