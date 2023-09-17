import { findIndex } from "lodash";

export const findFileIndex = (fileList, filePath) => {
  return findIndex(fileList.files, (f) => {
    return f.path === filePath;
  });
};
