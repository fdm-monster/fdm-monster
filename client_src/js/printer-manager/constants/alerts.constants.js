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
  }
};
