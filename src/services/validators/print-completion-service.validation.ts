import { z } from "zod";
import { EVENT_TYPES, EVENT_TYPES_ARRAY } from "../octoprint/constants/octoprint-websocket.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const createPrintCompletionSchema = (isSqlite: boolean) =>
  z.object({
    fileName: z.string().min(1, "File name is required"),
    status: z.enum(EVENT_TYPES_ARRAY, {
      error: (issue) => {
        if (issue.code === "invalid_value") {
          return { message: `Status must be one of: ${Object.values(EVENT_TYPES).join(", ")}` };
        }
        return { message: "Invalid status" };
      },
    }),
    printerId: idRuleV2(isSqlite),
    completionLog: z.string().optional(),
    context: z.any(),
  });
