const crudFileRules = {
  id: "required|mongoId",
  fullPath: "required"
};

const getFilesRules = {
  recursive: "required|boolean"
};

module.exports = {
  getFilesRules,
  crudFileRules
};
