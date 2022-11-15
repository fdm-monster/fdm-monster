const getFilesRules = {
  recursive: "required|boolean",
};

const uploadFileRules = {};

const getFileRules = {
  path: "required|string",
};

const createFolderRules = {
  foldername: "required|string",
  path: "required|string",
};

const moveFileOrFolderRules = {
  filePath: "required|string",
  destination: "required|string",
};

const minBedTemp = 0;
const maxBedTemp = 100;

const fileUploadCommandsRules = {
  select: "boolean",
  print: "required|boolean",
  bedTemp: `integer|between:${minBedTemp},${maxBedTemp}`,
};

const selectAndPrintFileRules = {
  filePath: "required|string",
  print: "required|boolean",
  bedTemp: `integer|between:${minBedTemp},${maxBedTemp}`,
};

const localFileUploadRules = {
  localLocation: "required",
  select: "boolean",
  print: "boolean",
};

module.exports = {
  minBedTemp,
  maxBedTemp,
  getFilesRules,
  selectAndPrintFileRules,
  localFileUploadRules,
  uploadFileRules,
  createFolderRules,
  moveFileOrFolderRules,
  fileUploadCommandsRules,
  getFileRules,
};
