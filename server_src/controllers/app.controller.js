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
    if (serverSettings.server.loginRequired === false) {
      res.redirect("/dashboard");
    } else {
      if (req.isAuthenticated()) {
        res.redirect("/dashboard");
      } else {
        res.render("welcome", {
          page: "Welcome",
          serverPageTitle: this.#serverPageTitle,
          registration: serverSettings.server.registration,
          serverSettings
        });
      }
    }
  }
}

// prettier-ignore
module.exports = createController(AppController)
  .prefix("/")
  .before([])
  //.get("wizard, "wizard")
  .get("", "welcome");
