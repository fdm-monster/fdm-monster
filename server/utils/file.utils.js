const { existsSync, unlinkSync } = require("fs");

function deleteExistingFile(fileName) {
  let fileExists = false;
  if (existsSync(fileName)) unlinkSync(fileName);
  return fileExists;
}

module.exports = {
  deleteExistingFile
};
