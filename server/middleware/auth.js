const DITokens = require("../container.tokens");
const AuthenticationError = require("passport/lib/errors/authenticationerror");

module.exports = {
  async ensureAuthenticated(req, res, next) {
    const settingsStore = req.container.resolve(DITokens.settingsStore);
    const serverSettings = settingsStore.getServerSettings();

    if (!serverSettings?.server?.loginRequired) {
      return next();
    }
    if (req.isAuthenticated()) {
      return next();
    }

    throw new AuthenticationError("Not authenticated", 401);
  }
};
