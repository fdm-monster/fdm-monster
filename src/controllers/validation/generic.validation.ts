import { z } from "zod";

const isHexadecimal = (str: string) => /^[a-fA-F0-9]+$/.test(str);

const isMongoId = (str: string) => isHexadecimal(str) && str.length === 24;

export const idRuleV2 = (isSqlite: boolean) =>
  isSqlite
    ? z.number().min(1)
    : z.string().refine(isMongoId, {
        message: "Invalid MongoDB ObjectId",
      });

export const idRulesV2 = (isSqlite: boolean) =>
  z
    .object({
      id: idRuleV2(isSqlite),
    })
    .strict();
