const _ = require("lodash");

const findFileIndex = (fileList, filePath) => {
  return _.findIndex(fileList.files, (f) => {
    return f.path === filePath;
  });
};

module.exports = {
  findFileIndex,
};
