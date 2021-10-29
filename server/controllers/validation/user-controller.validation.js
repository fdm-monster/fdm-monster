const registerUserRules = {
  name: "required|string",
  username: "required|string",
  password: "required|string",
  password2: "required|string|same:password",
  roles: "required|array",
  "roles.*": "required|mongoId"
};

module.exports = {
  registerUserRules
};
