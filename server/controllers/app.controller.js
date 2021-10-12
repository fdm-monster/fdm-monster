const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");

class AppController {
  #serverVersion;
  #settingsStore;
  #printersStore;
  #serverPageTitle;

  constructor({ settingsStore, printersStore, serverVersion, serverPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#serverPageTitle = serverPageTitle;
  }

  welcome(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();

    if (serverSettings.server.loginRequired === false || req.isAuthenticated()) {
      res.send({
        message:
          "Login not required. Please load UI instead by requesting any route with text/html Content-Type"
      });
    } else {
      res.send({
        message: "Please load the welcome API as this server is not instantiated properly."
      });
    }
  }
}

// prettier-ignore
module.exports = createController(AppController)
  .prefix(AppConstants.apiRoute +"/")
  .before([])
  //.get("wizard, "wizard")
  .get("", "welcome");
