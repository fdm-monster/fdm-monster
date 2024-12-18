export const idRuleV2 = (isSqlite: boolean) => `required|${isSqlite ? "integer|min:1" : "mongoId"}`;

export const idRulesV2 = (isSqlite: boolean) => ({
  id: idRuleV2(isSqlite),
});
