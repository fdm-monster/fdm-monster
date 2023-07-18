const registerUserRules = {
  username: "required|string",
  password: "required|string",
  roles: "required|array",
  "roles.*": "required|mongoId",
};

module.exports = {
  registerUserRules,
};
