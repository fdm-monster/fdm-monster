class PrinterProfilesCache {
  #printerProfiles = [];

  getPrinterProfiles(printerId) {
    if (!this.#printerProfiles) return;

    return this.#printerProfiles.find((profile) => profile.printerId.toString() === printerId);
  }

  setPrinterProfiles(printerId, profiles) {
    const printerProfiles = this.#printerProfiles.find(
      (profile) => profile.printerId.toString() === printerId
    );
    if (!printerProfiles) {
      this.#printerProfiles.push({
        printerId,
        profiles
      });
    } else {
      printerProfiles.profiles = profiles;
    }
  }
}

module.exports = PrinterProfilesCache;
