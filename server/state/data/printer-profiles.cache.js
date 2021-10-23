module.exports = class PrinterProfilesCache {
  // Data array
  #printerProfiles = [];

  getPrinterProfiles(printerId) {
    if (!this.#printerProfiles) return;

    return this.#printerProfiles.find((profile) => profile.printerId.toString() === printerId);
  }

  // TODO old transformation
  //   for (let pr = 0; pr < profiles.length; pr++) {
  //   const profile = {
  //     _id: null,
  //     manufacturer: profiles[pr].profile.manufacturer,
  //     material: profiles[pr].profile.material,
  //     density: profiles[pr].profile.density,
  //     diameter: profiles[pr].profile.diameter
  //   };
  //   if (this.#settingsStore.isFilamentEnabled()) {
  //   profile._id = profiles[pr].profile.index;
  // } else {
  //   profile._id = profiles[pr]._id;
  // }
  // profilesArray.push(profile);
  // }

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
};
