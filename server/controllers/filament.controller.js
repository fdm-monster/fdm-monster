const _ = require("lodash");
const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const Filament = require("../models/Filament");
const Profile = require("../models/Profile");
const { AppConstants } = require("../server.constants");
const { validateMiddleware } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

class FilamentController {
  #settingsStore;
  #printersStore;
  #filamentCache;
  #filamentStore;

  #logger;

  constructor({ settingsStore, printersStore, filamentCache, filamentStore, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#printersStore = printersStore;
    this.#filamentCache = filamentCache;
    this.#filamentStore = filamentStore;

    this.#logger = loggerFactory("Server-Filament");
  }

  async list(req, res) {
    const spools = await this.#filamentCache.getFilamentSpools();
    res.send({ spools });
  }

  async selectFilament(req, res) {
    const { id } = await validateMiddleware(req, idRules);
    // TODO rules
    const { tool, filamentId } = req.body;
    const printer = this.#printersStore.getPrinterState(id);

    res.send();
  }

  async create(req, res) {
    const filament = req.body;
    this.#logger.info("Saving Filament Manager Filament: ", filament);

    // TODO What a mess
    const spool = {
      name: filament.spoolsName,
      profile: filament.spoolsProfile,
      price: filament.spoolsPrice,
      weight: filament.spoolsWeight,
      used: filament.spoolsUsed,
      tempOffset: filament.spoolsTempOffset
    };
    const newFilament = new Filament(spool);
    await newFilament.save();

    this.#logger.info("New Filament saved successfully: ", newFilament);

    res.send({
      res: "success",
      spools: newFilament
    });
  }

  async delete(req, res) {
    let searchId = req.body.id;
    this.#logger.info("Deleting Filament Manager Profile: ", searchId);

    await Filament.deleteOne({ _id: searchId }).exec();
    this.#logger.info("Successfully deleted: ", searchId);

    const filamentList = Filament.find({});
    res.send(filamentList);
  }

  async update(req, res) {
    const searchId = req.body.id;
    this.#logger.info("Request to update spool id: ", searchId);
    this.#logger.info("New details: ", req.body.spool);
    const newContent = req.body.spool;
    const spools = await Filament.findById(searchId);

    if (spools.spools.name != newContent[0]) {
      spools.spools.name = newContent[0];
      spools.markModified("spools");
    }
    if (spools.spools.profile != newContent[5]) {
      spools.spools.profile = newContent[5];
      spools.markModified("spools");
    }
    if (spools.spools.price != newContent[1]) {
      spools.spools.price = newContent[1];
      spools.markModified("spools");
    }
    if (spools.spools.weight != newContent[2]) {
      spools.spools.weight = newContent[2];
      spools.markModified("spools");
    }
    if (spools.spools.used != newContent[3]) {
      spools.spools.used = newContent[3];
      spools.markModified("spools");
    }
    if (spools.spools.tempOffset != newContent[4]) {
      spools.spools.tempOffset = newContent[4];
      spools.markModified("spools");
    }
    await spools.save();

    const filamentList = Filament.find({});
    res.send(filamentList);
  }
}

// prettier-ignore
module.exports = createController(FilamentController)
    .prefix(AppConstants.apiRoute + "/filament")
    .before([ensureAuthenticated])
    .get("/", "list")
    .post("/:id", "create")
    .patch("/:id", "update")
    .delete("/:id", "delete")
    .post("/:id/select-filament", "selectFilament");
