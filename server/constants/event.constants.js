// This is still work in progress
const PEVENTS = {
  init: "init",
  current: "current",
  event: "event"
};

const uploadProgressEvent = (token) => `upload.progress.${token}`;
const uploadCancelHandler = (token) => `upload.cancel.handler.${token}`;

module.exports = {
  PEVENTS,
  uploadProgressEvent,
  uploadCancelHandler
};
