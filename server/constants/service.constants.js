/**
 * Default model properties for history entries saved to database
 * @returns {{fileName: string, notes: string, endDate: string, spoolUsed: string, success: boolean, filePath: string, printerName: string, printerIndex: number, filamentLength: number, startDate: string, printTime: string, filamentVolume: number}}
 */
function getDefaultHistoryEntry() {
  return {
    printerIndex: 0,
    printerName: "",
    success: true,
    fileName: "",
    filePath: "",
    startDate: "",
    endDate: "",
    printTime: "",
    spoolUsed: "",
    filamentLength: 0,
    filamentVolume: 0,
    notes: ""
  };
}

const getWolPowerSubSettingsDefault = () => {
  return {
    enabled: false,
    ip: "255.255.255.0",
    packets: "3",
    port: "9",
    interval: "100",
    MAC: ""
  };
};

const getPowerSettingsDefault = () => {
  return {
    powerOnCommand: "",
    powerOnURL: "",
    powerOffCommand: "",
    powerOffURL: "",
    powerToggleCommand: "",
    powerToggleURL: "",
    powerStatusCommand: "",
    powerStatusURL: "",
    wol: getWolPowerSubSettingsDefault()
  };
};

const getSettingsAppearanceDefault = () => ({
  color: "default",
  colorTransparent: false,
  defaultLanguage: "_default",
  name: "",
  showFahrenheitAlso: false
});

const getCostSettingsDefault = () => {
  return {
    powerConsumption: 0.5,
    electricityCosts: 0.15,
    purchasePrice: 500,
    estimateLifespan: 43800,
    maintenanceCosts: 0.25
  };
};

function getTempTriggersDefault() {
  return {
    heatingVariation: 1,
    coolDown: 30
  };
}

function getFileListDefault() {
  // Also used cache constant!
  return {
    files: undefined,
    fileCount: 0,
    folders: undefined,
    folderCount: 0
  };
}

function getDefaultPrinterEntry() {
  return {
    settingsAppearance: getSettingsAppearanceDefault(),
    costSettings: getCostSettingsDefault(),
    powerSettings: getPowerSettingsDefault(),
    tempTriggers: getTempTriggersDefault(),
    fileList: getFileListDefault()
  };
}

const UUID_LENGTH = 32;
const minPrinterGroupNameLength = 3;

class Status {
  static failure(message = "", args) {
    return {
      success: false,
      message: message || "",
      ...args
    };
  }

  static success(message = "", args) {
    return {
      success: true,
      message: message || "",
      ...args
    };
  }
}

module.exports = {
  getSettingsAppearanceDefault,
  getCostSettingsDefault,
  getPowerSettingsDefault,
  getWolPowerSubSettingsDefault,
  getFileListDefault,
  getDefaultHistoryEntry,
  getDefaultPrinterEntry,
  UUID_LENGTH,
  minPrinterGroupNameLength,
  Status
};
