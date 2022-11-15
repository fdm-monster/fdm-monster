const { inject } = require("awilix-express");
const { serverSettingKey } = require("../constants/server-settings.constants");

module.exports = {
  interceptRoles: inject(({ settingsStore, roleService }) => async (req, res, next) => {
    const serverSettings = settingsStore.getServerSettings();

    req.roles = req.user?.roles;
    if (serverSettings && !serverSettings[serverSettingKey]?.loginRequired && !req.user) {
      req.roles = [roleService.getDefaultRole()];
    }

    next();
  }),
};
