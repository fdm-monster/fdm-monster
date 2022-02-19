import {getFileListDefault} from "./service.constants.js";

export function getJobCacheDefault() {
    return {
        job: undefined,
        progress: undefined,
        currentZ: undefined
    };
}

export function getFileCacheDefault() {
    return {
        fileList: getFileListDefault(),
        storage: undefined
    };
}