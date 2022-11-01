const { EVENT_TYPES } = require("../octoprint/constants/octoprint-websocket.constants");
const createPrintCompletionRules = {
  fileName: `required`,
  status: `required|string|in:${Object.values(EVENT_TYPES)}`,
  printerId: "required|string|mongoId",
  completionLog: "string",
  context: "object",
};

module.exports = {
  createPrintCompletionRules,
};
