const clientSettingsUpdateRules = {
    fileHandling: "object",
    "fileHandling.autoRemoveOldFilesBeforeUpload": "boolean",
    "fileHandling.autoRemoveOldFilesCriteriumDays": "integer|min:0",
};
export { clientSettingsUpdateRules };
export default {
    clientSettingsUpdateRules
};
