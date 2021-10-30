const { createController } = require("awilix-express");
const { authenticate } = require("../../middleware/authenticate");
const Logger = require("../../handlers/logger.js");
const multer = require("multer");
const { AppConstants } = require("../../server.constants");

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, callback) {
    callback(null, "bg.jpg");
  }
});
const upload = multer({ storage: Storage });

class StorageController {
  #logger = new Logger("Server-API");

  constructor({}) {}

  uploadBackgroundImage(req, res) {
    res.redirect("/system");
  }
}

// prettier-ignore
module.exports = createController(StorageController)
  .prefix(AppConstants.apiRoute + "/settings")
  .before([authenticate])
  .post("/backgroundUpload", "uploadBackgroundImage", {before: [upload.single("myFile")]});
