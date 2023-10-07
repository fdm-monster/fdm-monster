import { EVENT_TYPES } from "../octoprint/constants/octoprint-websocket.constants";

export const createPrintCompletionRules = {
  fileName: "required",
  status: `required|string|in:${Object.values(EVENT_TYPES)}`,
  printerId: "required|string|mongoId",
  completionLog: "string",
  context: "required|object",
};
