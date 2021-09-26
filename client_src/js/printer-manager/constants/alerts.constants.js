const defaultDelay = 2000;

export const ALERTS = {
  SCANNING_NETWORK: {
    message: "Scanning your network for new devices now... Please wait!",
    delay: 20000
  },
  SCANNED_NETWORK: {
    message:
      "Devices on your network have been scanned, any successful matches should now be visible to add to OctoFarm.",
    delay: defaultDelay
  },
  STARTED_BG_RESYNC: {
    message:
      "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen.",
    delay: defaultDelay
  },
  UPDATED_PRINTERS: {
    delay: defaultDelay,
    message: `Printer settings have been updated.`
  },
  ERROR_UPDATING_PRINTERS: {
    delay: 3000,
    message: "Something went wrong updating the printers."
  },
  ERROR_IMPORT_NOT_JSON: {
    delay: 3000,
    message: "File extension is not 'json'!"
  },
  WARNING_SAVING_PRINTERS_SLOW: {
    delay: 5000,
    message: "Starting to save all your instances. This may take some time."
  },
  SUCCESS_SAVED_PRINTERS: {
    delay: 4000,
    message: "Successfully saved all your instances"
  },
  ERROR_EXPORTING_PRINTERS: {
    delay: 3000,
    message: "Error exporting printers, please check logs"
  }
};
