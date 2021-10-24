const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { ensureAuthenticated } = require("../middleware/auth");
const { printerResolveMiddleware } = require("../middleware/printer");
const { getScopedPrinter } = require("../handlers/validators");
const Profile = require("../models/Profile");

class PrinterProfilesController {
  #printerProfilesCache;
  #octoPrintApiService;
  #settingsStore;
  #logger;

  constructor({ settingsStore, printerProfilesCache, octoPrintApiService, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#printerProfilesCache = printerProfilesCache;
    this.#octoPrintApiService = octoPrintApiService;
    this.#logger = loggerFactory("Server-API");
  }

  async listProfiles(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const profiles = await this.#octoPrintApiService.listProfiles(printerLogin);
    res.send({ profiles });
  }

  async listProfilesCache(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const profiles = await this.#printerProfilesCache.getPrinterProfiles(currentPrinterId);
    res.send({ profiles });
  }

  async createProfile(req, res) {
    const newProfile = req.body;
    const profile = {
      vendor: newProfile.manufacturer,
      material: newProfile.material,
      density: newProfile.density,
      diameter: newProfile.diameter
    };

    this.#logger.info("Saving Filament Manager Profile: ", newProfile);
    const profileDoc = new Profile({
      profile
    });

    await profileDoc.save();
  }

  async updateProfile(req, res) {
    let searchId = req.body.id;
    const newContent = req.body.profile;
    this.#logger.info("Profile Edit Request: ", newContent);

    const profile = await Profile.findById(searchId);
    if (profile.profile.manufacturer != newContent[0]) {
      profile.profile.manufacturer = newContent[0];
      profile.markModified("profile");
    }
    if (profile.profile.material != newContent[1]) {
      profile.profile.material = newContent[1];
      profile.markModified("profile");
    }
    if (profile.profile.density != newContent[2]) {
      profile.profile.density = newContent[2];
      profile.markModified("profile");
    }
    if (profile.profile.diameter != newContent[3]) {
      profile.profile.diameter = newContent[3];
      profile.markModified("profile");
    }
    await profile.save();
    this.#logger.info("Profile saved successfully");

    res.send(profile);
  }

  async deleteProfile(req, res) {
    const searchId = req.body.id;
    this.#logger.info("Profile delete request: ", searchId);

    await Profile.deleteOne({ _id: searchId }).exec();
    this.#logger.info("Profile deleted successfully");

    const profiles = await Profile.find();
    res.send({ profiles });
  }
}

module.exports = createController(PrinterProfilesController)
  .prefix(AppConstants.apiRoute + "/printer-profiles")
  .before([ensureAuthenticated, printerResolveMiddleware()])
  .get("/:id", "listProfiles")
  .get("/:id/cache", "listProfilesCache")
  .post("/:id", "create")
  .patch("/:id", "update")
  .delete("/:id", "delete");
