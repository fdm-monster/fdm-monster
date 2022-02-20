// This is still work in progress
const PEVENTS = {
    init: "init",
    current: "current",
    event: "event"
};
const uploadProgressEvent = (token) => `upload.progress.${token}`;
export { PEVENTS };
export { uploadProgressEvent };
export default {
    PEVENTS,
    uploadProgressEvent
};
