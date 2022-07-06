const { findColorRAL } = require("../../constants/ral-color-map.constants");

describe("RALColorMap", function () {
  it("should map to color or fallback", async function () {
    expect(findColorRAL("wit")).toMatchObject({
      RAL: 9003,
      color: "wit"
    });
    expect(findColorRAL("gebrokenwit")).toMatchObject({
      RAL: 9003,
      color: "gebrokenwit"
    });
    expect(findColorRAL("bronsgoud")).toMatchObject({
      RAL: 1036,
      color: "bronsgoud"
    });
  });

  it("should not throw on illegal color name", () => {
    expect(findColorRAL()).toMatchObject({});
    expect(findColorRAL("jumbo yellow")).toMatchObject({
      color: "jumbo yellow"
    });
  });
});
