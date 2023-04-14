const MATERIALS = {
  CARBON: "CARBON",
  PETG: "PETG",
  PLA: "PLA",
  BRONZE: "BRONZE",
  COPPER: "COPPER",
  FLEX: "FLEX",
};

const getSettingsAppearanceDefault = () => ({
  name: "",
});

function getFileListDefault() {
  return {
    files: [],
    folders: [],
    free: 0,
    total: 0,
  };
}

function getDefaultPrinterEntry() {
  return {
    settingsAppearance: getSettingsAppearanceDefault(),
    fileList: getFileListDefault(),
  };
}

const UUID_LENGTH = 32;
const minPrinterFloorNameLength = 3;

module.exports = {
  MATERIALS,
  getSettingsAppearanceDefault,
  getFileListDefault,
  getDefaultPrinterEntry,
  UUID_LENGTH,
  minPrinterFloorNameLength,
};
