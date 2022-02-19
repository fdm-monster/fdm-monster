import service from "./service.constants";
const { getFileListDefault } = service;
function getJobCacheDefault() {
    return {
        job: undefined,
        progress: undefined,
        currentZ: undefined
    };
}
function getFileCacheDefault() {
    return {
        fileList: getFileListDefault(),
        storage: undefined
    };
}
export { getJobCacheDefault };
export { getFileCacheDefault };
export default {
    getJobCacheDefault,
    getFileCacheDefault
};
