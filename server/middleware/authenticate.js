const DITokens = require("../container.tokens");
const AuthenticationError = require("passport/lib/errors/authenticationerror");

module.exports = {
  async authenticate(req, res, next) {
    const settingsStore = req.container.resolve(DITokens.settingsStore);
    const serverSettings = settingsStore.getServerSettings();

    if (!serverSettings?.server?.loginRequired) {
      return next();
    }
    if (req.isAuthenticated()) {
      return next();
    }

    throw new AuthenticationError("Not authenticated", 401);
  },
  authorizeRoles(roles) {
    return async (req, res, next) => {
      const settingsStore = req.container.resolve(DITokens.settingsStore);
      const roleService = req.container.resolve(DITokens.roleService);
      const serverSettings = settingsStore.getServerSettings();

      if (!serverSettings?.server?.loginRequired) {
        req.roles = await roleService.getDefaultRoles();
      }
      if (req.user) {
        console.log("asd", req.user);
      }

      next();
    };
  }
};
