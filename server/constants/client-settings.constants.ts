const getDefaultFileHandlingSettings = () => ({
    autoRemoveOldFilesBeforeUpload: false,
    autoRemoveOldFilesCriteriumDays: 5
});
const getDefaultClientSettings = () => ({
    fileHandling: getDefaultFileHandlingSettings()
});
export { getDefaultFileHandlingSettings };
export { getDefaultClientSettings };
export default {
    getDefaultFileHandlingSettings,
    getDefaultClientSettings
};
