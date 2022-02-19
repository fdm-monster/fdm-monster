import _ from "lodash";

export const findFileIndex = (fileList, filePath) => {
    return _.findIndex(fileList.files, (f) => {
        return f.path === filePath;
    });
};
