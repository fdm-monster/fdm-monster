const {
  remapOctoPrintState,
  OP_STATE,
  mapStateToColor,
  PSTATE
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
    expect(mapStateToColor(null).category).toBe("Active");
    expect(mapStateToColor(undefined).category).toBe("Active");
    expect(mapStateToColor(PSTATE.OfflineAfterError).category).toBe("Error");
  });
});
