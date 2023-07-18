const registerUserRules = {
  username: "required|string",
  password: "required|string",
  password2: "required|string|same:password",
};

module.exports = {
  registerUserRules,
};
