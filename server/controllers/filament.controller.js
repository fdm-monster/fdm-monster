const _ = require("lodash");
const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const Filament = require("../models/Filament");
const Profiles = require("../models/Profiles.js");
const { AppConstants } = require("../server.constants");

class FilamentController {
  #settingsStore;
  #printersStore;
  #filamentCache;
  #filamentStore;
  #filamentManagerPluginService;

  #logger;

  constructor({
    settingsStore,
    printersStore,
    filamentManagerPluginService,
    filamentCache,
    filamentStore,
    loggerFactory
  }) {
    this.#settingsStore = settingsStore;
    this.#printersStore = printersStore;
    this.#filamentCache = filamentCache;
    this.#filamentStore = filamentStore;
    this.#filamentManagerPluginService = filamentManagerPluginService;

    this.#logger = loggerFactory("Server-FilamentManager");
  }

  async list(req, res) {
    const spools = await this.#filamentCache.getFilamentSpools();
    res.send({ spools });
  }

  async disableFilamentManagerPlugin(req, res) {
    this.#logger.info("Disabling filament manager plugin for 3DPF");
    await Filament.deleteMany();
    await Profiles.deleteMany();

    await this.#settingsStore.setFilamentManagerPluginEnabled(false);
    this.#logger.info("Successfully disabled filament manager");

    res.send();
  }

  async selectFilament(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    this.#logger.info("Request to change:", req.body.printerId + "selected filament");
    if (filamentManager && req.body.spoolId != 0) {
      const printerList = Runner.returnFarmPrinters();
      const i = _.findIndex(printerList, function (o) {
        return o._id == req.body.printerId;
      });
      const printer = printerList[i];
      const spool = await Filament.findById(req.body.spoolId);
      const selection = {
        tool: req.body.tool,
        spool: { id: spool.spools.fmID }
      };

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/selections/0`;
      const updateFilamentManager = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ selection })
      });
    }

    await Runner.selectedFilament(req.body.printerId, req.body.spoolId, req.body.tool);
    FilamentClean.start(filamentManager);
    res.send();
  }

  async create(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    const filament = req.body;
    this.#logger.info("Saving Filament Manager Filament: ", filament);
    const filamentManagerID = null;

    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
      let printer = null;

      for (let i = 0; i < printerList.length; i += 1) {
        if (
          printerList[i].stateColour.category === "Disconnected" ||
          printerList[i].stateColour.category === "Idle" ||
          printerList[i].stateColour.category === "Active" ||
          printerList[i].stateColour.category === "Complete"
        ) {
          printer = printerList[i];
          break;
        }
      }
      const profiles = await Profiles.find({});
      const findID = _.findIndex(profiles, function (o) {
        return o.profile.index == filament.spoolsProfile;
      });

      const profile = {
        vendor: profiles[findID].profile.manufacturer,
        material: profiles[findID].profile.material,
        density: profiles[findID].profile.density,
        diameter: profiles[findID].profile.diameter,
        id: profiles[findID].profile.index
      };
      const spool = {
        name: filament.spoolsName,
        profile,
        cost: filament.spoolsPrice,
        weight: filament.spoolsWeight,
        used: filament.spoolsUsed,
        temp_offset: filament.spoolsTempOffset
      };
      this.#logger.info("Updating OctoPrint: ", spool);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/spools`;
      let updateFilamentManager = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ spool })
      });
      updateFilamentManager = await updateFilamentManager.json();
      const reSync = await this.#filamentManagerPluginService.filamentManagerReSync("AddSpool");

      res.send({
        res: "success",
        spools: reSync.newSpools,
        filamentManager
      });
    } else {
      const spools = {
        name: filament.spoolsName,
        profile: filament.spoolsProfile,
        price: filament.spoolsPrice,
        weight: filament.spoolsWeight,
        used: filament.spoolsUsed,
        tempOffset: filament.spoolsTempOffset,
        fmID: filamentManagerID
      };
      const newFilament = new Filament({
        spools
      });
      newFilament.save().then(async (e) => {
        this.#logger.info("New Filament saved successfully: ", newFilament);
        await this.#filamentManagerPluginService.filamentManagerReSync();
        FilamentClean.start(filamentManager);
        res.send({
          res: "success",
          spools: newFilament,
          filamentManager
        });
      });
    }
  }

  async delete(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    let searchId = req.body.id;
    this.#logger.info("Deleting Filament Manager Profile: ", searchId);
    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
      let printer = null;
      for (let i = 0; i < printerList.length; i++) {
        if (
          printerList[i].stateColour.category === "Disconnected" ||
          printerList[i].stateColour.category === "Idle" ||
          printerList[i].stateColour.category === "Active" ||
          printerList[i].stateColour.category === "Complete"
        ) {
          printer = printerList[i];
          break;
        }
      }

      searchId = await Filament.findById(searchId);
      this.#logger.info("Updating Octoprint to remove: ", searchId);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/spools/${searchId.spools.fmID}`;
      const updateFilamentManager = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        }
      });

      const rel = await Filament.deleteOne({ _id: searchId }).exec();
      this.#logger.info("Successfully deleted: ", searchId);
      rel.status = 200;
      Filament.find({}).then((spools) => {
        FilamentClean.start(filamentManager);
        res.send({ spool: spools });
      });
    } else {
      const rel = await Filament.deleteOne({ _id: searchId }).exec();
      this.#logger.info("Successfully deleted: ", searchId);
      rel.status = 200;
      Filament.find({}).then((spools) => {
        FilamentClean.start(filamentManager);
        res.send({ spool: spools });
      });
    }
  }

  async update(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    const searchId = req.body.id;
    this.#logger.info("Request to update spool id: ", searchId);
    this.#logger.info("New details: ", req.body.spool);
    const newContent = req.body.spool;
    const spools = await Filament.findById(searchId);

    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
      let printer = null;
      for (let i = 0; i < printerList.length; i++) {
        if (
          printerList[i].stateColour.category === "Disconnected" ||
          printerList[i].stateColour.category === "Idle" ||
          printerList[i].stateColour.category === "Active" ||
          printerList[i].stateColour.category === "Complete"
        ) {
          printer = printerList[i];
          break;
        }
      }
      const filamentManagerID = newContent[5];
      const profiles = await Profiles.find({});
      const findID = _.findIndex(profiles, function (o) {
        return o.profile.index == filamentManagerID;
      });

      const profile = {
        vendor: profiles[findID].profile.manufacturer,
        material: profiles[findID].profile.material,
        density: profiles[findID].profile.density,
        diameter: profiles[findID].profile.diameter,
        id: profiles[findID].profile.index
      };
      const spool = {
        name: newContent[0],
        profile,
        cost: newContent[1],
        weight: newContent[2],
        used: newContent[3],
        temp_offset: newContent[4]
      };
      this.#logger.info("Updating OctoPrint: ", spool);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/spools/${spools.spools.fmID}`;
      const updateFilamentManager = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ spool })
      });
    }

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
    Runner.updateFilament();
    Filament.find({}).then((spools) => {
      this.#logger.info("New spool details saved: ", req.body.spool);
      FilamentClean.start(filamentManager);
      Runner.updateFilament();
      res.send({ spools });
    });
  }

  async filamentManagerReSync(req, res) {
    this.#logger.info("Re-Syncing filament manager database");

    const reSync = await this.#filamentManagerPluginService.filamentManagerReSync();
    res.send(reSync);
  }

  async filamentManagerSync(req, res) {
    this.#logger.info("Turning on filament manager sync...");

    const printerList = Runner.returnFarmPrinters();
    let printer = null;
    this.#logger.info("Looking for online printer...");
    for (let i = 0; i < printerList.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
        this.#logger.info(
          "Using ",
          printer.printerURL + " to establish a connection to Filament Manager Plugin..."
        );
        break;
      }
    }

    if (printer === null) {
      this.#logger.info("No printer online, please connect a printer...");
      res.send({ status: false });
    }

    let spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apiKey
      }
    });

    this.#logger.info("Grabbing Profiles");
    // TODO move to client service
    let profiles = await fetch(`${printer.printerURL}/plugin/filamentmanager/profiles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apiKey
      }
    });

    this.#logger.info("Grabbing Spools");
    // Make sure filament manager responds...
    if (spools.status != 200 || profiles.status != 200) {
      this.#logger.info(
        "Couldn't grab something: Profiles Status:" +
          profiles.status +
          " Spools Status: " +
          spools.status
      );
      res.send({ status: false });
    }
    await Filament.deleteMany({});
    await Profiles.deleteMany({});
    spools = await spools.json();
    profiles = await profiles.json();
    spools.spools.forEach((sp) => {
      this.#logger.info("Saving Filament: ", sp);
      const spools = {
        name: sp.name,
        profile: sp.profile.id,
        price: sp.cost,
        weight: sp.weight,
        used: sp.used,
        tempOffset: sp.temp_offset,
        fmID: sp.id
      };
      const newS = new Filament({
        spools
      });
      newS.save();
    });
    profiles.profiles.forEach((sp) => {
      this.#logger.info("Saving Profile: ", sp);
      const profile = {
        index: sp.id,
        density: sp.density,
        diameter: sp.diameter,
        manufacturer: sp.vendor,
        material: sp.material
      };
      const newP = new Profiles({
        profile
      });
      newP.save();
    });

    const serverSettings = await ServerSettings.find({});
    serverSettings[0].filamentManager = true;
    FilamentClean.start(serverSettings[0].filamentManager);
    serverSettings[0].markModified("filamentManager");
    serverSettings[0].save();
    SettingsClean.start();
    // Return success
    if (spools.status === 200 || profiles.status != 200) {
      res.send({ status: true });
    }
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
    .get("/dropdown-list", "dropDownList")
    .patch("/select", "selectFilament")
    .get("/printer-list", "filamentList")
    // WIP line
    .put("/filament-manager/resync", "filamentManagerReSync")
    .patch("/filament-manager/sync", "filamentManagerSync")
    .patch("/filament-manager/disable", "disableFilamentManagerPlugin");
