export const idRules: { id: string } = {
  id: "required|mongoId",
};

export const idRulesV2 = (isSqlite: boolean) => ({
  id: `required|${isSqlite ? "integer|min:1" : "required|mongoId"}`,
});
