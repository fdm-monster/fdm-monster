import _ from "lodash";

export const findFileIndex = (fileList, filePath) => {
    return _.findIndex(fileList.files, (f: any) => {
        return f.path === filePath;
    });
};
