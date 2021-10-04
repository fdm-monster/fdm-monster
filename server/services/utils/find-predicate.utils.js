const _ = require("lodash");

const findFileIndex = (fileList, fullPath) => {
  return _.findIndex(fileList.files, (f) => {
    return f.path === fullPath;
  });
};

module.exports = {
  findFileIndex
};
