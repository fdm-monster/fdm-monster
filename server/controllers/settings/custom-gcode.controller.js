const CustomGcode = require("../../models/CustomGcode");
const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");
const { AppConstants } = require("../../server.constants");

class CustomGcodeController {
  #logger = new Logger("Server-API");
  #serverVersion;
  #settingsStore;
  #serverPageTitle;

  constructor({ settingsStore, serverVersion, serverPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#serverPageTitle = serverPageTitle;
  }

  deleteGcode(req, res) {
    const scriptId = req.params.id;
    CustomGcode.findByIdAndDelete(scriptId, function (err) {
      if (err) {
        res.send(err);
      } else {
        res.send(scriptId);
      }
    });
  }

  async list(req, res) {
    const all = await CustomGcode.find();
    res.send(all);
  }

  async create(req, res) {
    let newScript = req.body;
    const saveScript = new CustomGcode(newScript);
    await saveScript
      .save()
      .then(res.send(saveScript))
      .catch((e) => res.send(e));
  }

  async edit(req, res) {
    const newObj = req.body;
    let script = await CustomGcode.findById(newObj.id);
    script.gcode = newObj.gcode;
    script.name = newObj.name;
    script.description = newObj.description;
    script.save();
    res.send(script);
  }
}

// prettier-ignore
module.exports = createController(CustomGcodeController)
  .prefix(AppConstants.apiRoute + "/settings/custom-gcode")
  .before([ensureAuthenticated])
  .delete("/delete/:id", "deleteGcode")
  .get("/", "list")
  .post("/edit", "edit")
  .post("/create", "create");
