const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const Filament = require("../models/Filament");
const { AppConstants } = require("../server.constants");
const { validateMiddleware, validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { ROLES } = require("../constants/authorization.constants");
const { createFilamentRules } = require("./validation/filament-controller.validation");

class FilamentController {
  #settingsStore;
  #printersStore;
  #filamentsStore;

  #logger;

  constructor({ settingsStore, printersStore, filamentsStore, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#printersStore = printersStore;
    this.#filamentsStore = filamentsStore;

    this.#logger = loggerFactory("Server-Filament");
  }

  async list(req, res) {
    const spools = await this.#filamentsStore.listFilaments();
    res.send(spools);
  }

  async get(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const filament = await this.#filamentsStore.getFilament(id);
    res.send(filament);
  }

  async create(req, res) {
    const data = await validateMiddleware(req, createFilamentRules);

    const result = await this.#filamentsStore.addFilament(data);
    res.send(result);
  }

  async delete(req, res) {
    const { id } = await validateInput(req.params, idRules);

    await this.#filamentsStore.deleteFilament(id);
    res.send();
  }

  // TODO reimplement
  // async update(req, res) {
  //   const searchId = req.body.id;
  //   this.#logger.info("Request to update spool id: ", searchId);
  //   this.#logger.info("New details: ", req.body.spool);
  //   const newContent = req.body.spool;
  //   const spools = await Filament.findById(searchId);
  //
  //   if (spools.spools.name != newContent[0]) {
  //     spools.spools.name = newContent[0];
  //     spools.markModified("spools");
  //   }
  //   if (spools.spools.profile != newContent[5]) {
  //     spools.spools.profile = newContent[5];
  //     spools.markModified("spools");
  //   }
  //   if (spools.spools.price != newContent[1]) {
  //     spools.spools.price = newContent[1];
  //     spools.markModified("spools");
  //   }
  //   if (spools.spools.weight != newContent[2]) {
  //     spools.spools.weight = newContent[2];
  //     spools.markModified("spools");
  //   }
  //   if (spools.spools.used != newContent[3]) {
  //     spools.spools.used = newContent[3];
  //     spools.markModified("spools");
  //   }
  //   if (spools.spools.tempOffset != newContent[4]) {
  //     spools.spools.tempOffset = newContent[4];
  //     spools.markModified("spools");
  //   }
  //   await spools.save();
  //
  //   const filamentList = Filament.find({});
  //   res.send(filamentList);
  // }
}

// prettier-ignore
module.exports = createController(FilamentController)
  .prefix(AppConstants.apiRoute + "/filament")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .get("/", "list")
  .post("/", "create")
  .get("/:id", "get")
  // .patch("/:id", "update")
  .delete("/:id", "delete");
