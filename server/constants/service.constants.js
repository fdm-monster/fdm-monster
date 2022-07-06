const ALL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const MATERIALS = {
  CARBON: "CARBON",
  PETG: "PETG",
  PLA: "PLA",
  BRONZE: "BRONZE",
  COPPER: "COPPER",
  FLEX: "FLEX"
};

/**
 * Get an empty history statistics object (inflate to class when methods and meta is required!)
 * @returns {{storageRemain: number, storageUsed: number, averageLength: number, biggestLength: number, storageTotal: number, storagePercent: number, smallestLength: number, smallestFile: number, averageFile: number, biggestFile: number}}
 */
function getDefaultFileStatistics() {
  return {
    storageUsed: 0,
    storageTotal: 0,
    storageRemain: 0,
    storagePercent: 0,
    biggestFile: 0,
    smallestFile: 0,
    biggestLength: 0,
    smallestLength: 0,
    averageFile: 0,
    averageLength: 0
  };
}

const DEFAULT_SPOOL_DENSITY = 1.24;
const DEFAULT_SPOOL_RATIO = 1.75 / 2;

/**
 * Get an empty history statistics object (inflate to class when methods and meta is required!)
 * @returns {{currentFailed: number, totalPrinterCost: number, highestFilamentUsage: number, completed: number, failed: number, lowestFilamentUsage: number, printerLoad: number, totalFilamentUsage: number, totalSpoolCost: number, highestSpoolCost: number, longestPrintTime: number, printerMost: number, highestPrinterCost: number, shortestPrintTime: number, averageFilamentUsage: number, averagePrintTime: number, cancelled: number, mostPrintedFile: number}}
 */
function getDefaultHistoryStatistics() {
  return {
    completed: 0,
    cancelled: 0,
    failed: 0,
    longestPrintTime: 0,
    shortestPrintTime: 0,
    averagePrintTime: 0,
    mostPrintedFile: 0,
    printerMost: 0,
    printerLoad: 0,
    totalFilamentUsage: 0,
    averageFilamentUsage: 0,
    highestFilamentUsage: 0,
    lowestFilamentUsage: 0,
    totalSpoolCost: 0,
    highestSpoolCost: 0,
    totalPrinterCost: 0,
    highestPrinterCost: 0,
    currentFailed: 0
  };
}

/**
 * Get an empty associative array with empty tool and bed temperature data objects
 * @returns {({data: [], name: string}|{data: [], name: string}|{data: [], name: string}|{data: [], name: string}|{data: [], name: string})[]}
 */
function getEmptyToolTemperatureArray() {
  return [
    {
      name: "Actual Tool",
      data: []
    },
    {
      name: "Target Tool",
      data: []
    },
    {
      name: "Actual Bed",
      data: []
    },
    {
      name: "Target Bed",
      data: []
    },
    {
      name: "Actual Chamber",
      data: []
    },
    {
      name: "Target Chamber",
      data: []
    }
  ];
}

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
  return {
    files: [],
    folders: [],
    free: 0,
    total: 0
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
  getDefaultFileStatistics,
  getDefaultHistoryStatistics,
  getEmptyToolTemperatureArray,
  DEFAULT_SPOOL_DENSITY,
  DEFAULT_SPOOL_RATIO,
  ALL_MONTHS,
  MATERIALS,
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
