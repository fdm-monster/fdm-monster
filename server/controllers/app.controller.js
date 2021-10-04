const { createController } = require("awilix-express");

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
      res.send({ message: "Login not required. Please load UI instead." });
    } else {
      res.send({
        message: "Please load the welcome API as this server is not instantiated properly."
      });
    }
  }
}

// prettier-ignore
module.exports = createController(AppController)
  .prefix("/")
  .before([])
  //.get("wizard, "wizard")
  .get("", "welcome");
