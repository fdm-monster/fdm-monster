import { z } from "zod";

export const idRuleV2 =
  z.number().min(1);

export const idRulesV2 =
  z.object({id: idRuleV2,}).strict();
