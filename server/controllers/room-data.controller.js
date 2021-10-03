const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const RoomData = require("../models/RoomData.js");
const { AppConstants } = require("../app.constants");

class RoomDataController {
  #serverVersion;
  #settingsStore;
  #serverPageTitle;

  constructor({ settingsStore, serverVersion, serverPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#serverPageTitle = serverPageTitle;
  }

  async create(req, res) {
    const roomData = req.body;
    // TODO add validation rules for roomData
    const databaseData = new RoomData(roomData);
    await databaseData.save();
  }
}

// prettier-ignore
module.exports = createController(RoomDataController)
  .prefix(AppConstants.apiRoute + "/room-data")
  .before([ensureAuthenticated])
  .post("/", "create");
