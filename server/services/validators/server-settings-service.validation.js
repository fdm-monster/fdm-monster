const serverSettingsUpdateRules = {
  server: "required|object",
  "server.registration": "required|boolean",
  "server.loginRequired": "required|boolean"
};

module.exports = {
  serverSettingsUpdateRules
};
