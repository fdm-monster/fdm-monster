const {
  remapOctoPrintState,
  OP_STATE,
  mapStateToColor,
  PSTATE,
  CATEGORY
} = require("../../constants/state.constants");

describe("StateConstants-Mapping", function () {
  it("should map illegal OctoPrint state without nullref", () => {
    remapOctoPrintState({
      flags: {},
      text: OP_STATE.Offline
    });
  });

  it("should map empty OctoPrint state without nullref", () => {
    remapOctoPrintState({
      flags: {},
      text: ""
    });
    remapOctoPrintState({
      flags: {},
      text: undefined
    });
    remapOctoPrintState({
      flags: {},
      text: null
    });
  });

  it("should map OctoPrint state with text similar to Error", () => {
    remapOctoPrintState({
      flags: {},
      text: "Error:"
    });
    remapOctoPrintState({
      flags: {},
      text: "Error"
    });
    remapOctoPrintState({
      flags: {},
      text: "error:"
    });
  });

  it("should map illegal state to color", () => {
    expect(mapStateToColor(null).category).toBe(CATEGORY.Active);
    expect(mapStateToColor(undefined).category).toBe(CATEGORY.Active);
    expect(mapStateToColor(PSTATE.Loading).category).toBe(CATEGORY.Idle);
    expect(mapStateToColor(PSTATE.Operational).category).toBe(CATEGORY.Idle);
    expect(mapStateToColor(PSTATE.Online).category).toBe(CATEGORY.Idle);
    expect(mapStateToColor(PSTATE.Paused).category).toBe(CATEGORY.Idle);
    expect(mapStateToColor(PSTATE.Printing).category).toBe(CATEGORY.Active);
    expect(mapStateToColor(PSTATE.Pausing).category).toBe(CATEGORY.Active);
    expect(mapStateToColor(PSTATE.Cancelling).category).toBe(CATEGORY.Active);
    expect(mapStateToColor(PSTATE.Starting).category).toBe(CATEGORY.Active);
    expect(mapStateToColor(PSTATE.Disabled).category).toBe(CATEGORY.Disabled);
    expect(mapStateToColor(PSTATE.Offline).category).toBe(CATEGORY.Offline);
    expect(mapStateToColor(PSTATE.Searching).category).toBe(CATEGORY.Offline);
    expect(mapStateToColor(PSTATE.NoAPI).category).toBe(CATEGORY.Offline);
    expect(mapStateToColor(PSTATE.Shutdown).category).toBe(CATEGORY.Offline);
    expect(mapStateToColor(PSTATE.Disconnected).category).toBe(CATEGORY.Disconnected);
    expect(mapStateToColor(PSTATE.Complete).category).toBe(CATEGORY.Complete);
    expect(mapStateToColor(PSTATE.ApiKeyRejected).category).toBe(CATEGORY.Error);
    expect(mapStateToColor(PSTATE.GlobalAPIKey).category).toBe(CATEGORY.Error);
    expect(mapStateToColor(PSTATE.Error).category).toBe(CATEGORY.Error);
    expect(mapStateToColor(PSTATE.OfflineAfterError).category).toBe(CATEGORY.Error);
  });
});
