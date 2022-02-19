const getDefaultFileHandlingSettings = () => ({
  autoRemoveOldFilesBeforeUpload: false,
  autoRemoveOldFilesCriteriumDays: 5
});

const getDefaultClientSettings = () => ({
  fileHandling: getDefaultFileHandlingSettings()
});

module.exports = {
  getDefaultFileHandlingSettings,
  getDefaultClientSettings
};
