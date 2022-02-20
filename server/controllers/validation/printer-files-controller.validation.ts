const getFilesRules = {
    recursive: "required|boolean"
};
const selectAndPrintFileRules = {
    filePath: "required|string",
    print: "required|boolean"
};
const uploadFileRules = {};
const getFileRules = {
    path: "required|string"
};
const createFolderRules = {
    foldername: "required|string",
    path: "required|string"
};
const moveFileOrFolderRules = {
    filePath: "required|string",
    destination: "required|string"
};
const fileUploadCommandsRules = {
    select: "boolean",
    print: "boolean"
};
const localFileUploadRules = {
    localLocation: "required",
    select: "boolean",
    print: "boolean"
};
export { getFilesRules };
export { selectAndPrintFileRules };
export { localFileUploadRules };
export { uploadFileRules };
export { createFolderRules };
export { moveFileOrFolderRules };
export { fileUploadCommandsRules };
export { getFileRules };
export default {
    getFilesRules,
    selectAndPrintFileRules,
    localFileUploadRules,
    uploadFileRules,
    createFolderRules,
    moveFileOrFolderRules,
    fileUploadCommandsRules,
    getFileRules
};
