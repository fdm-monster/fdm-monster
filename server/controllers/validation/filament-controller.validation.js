const createFilamentRules = {
  name: "required|string",
  manufacturer: "string",
  cost: "decimal|required",
  weight: "decimal|required",
  consumedRatio: "decimal|required",
  printTemperature: "decimal|required",
  meta: "object"
};

module.exports = {
  createFilamentRules
};
