const Printer = require("../../models/Printer");
const { expectValidationError } = require("../extensions");

describe("printer-schema", function () {
  it("should be invalid if sortIndex is not numeric", function (done) {
    const m = new Printer({
      apiKey: "asd",
      printerURL: "myawesomeprinter/",
      webSocketURL: "myawesomeprinter/",
      sortIndex: "a",
      settingsAppearance: {}
    });

    m.validate(function (err) {
      expectValidationError(err, ["sortIndex"], true);
      done();
    });
  });

  it("should be valid for required properties", function (done) {
    const m = new Printer({
      apiKey: "asd",
      printerURL: "myawesomeprinter/",
      webSocketURL: "myawesomeprinter/",
      settingsAppearance: {},
      sortIndex: "1"
    });

    m.validate(function (err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it("should be invalid if URLs, sortIndex, and apiKey properties are empty", function (done) {
    const m = new Printer({});

    m.validate(function (err) {
      expectValidationError(
        err,
        ["settingsAppearance", "sortIndex", "webSocketURL", "printerURL", "apiKey"],
        true
      );
      done();
    });
  });

  it("should be invalid if printer misses sortIndex and webSocketURL", function (done) {
    const m = new Printer({
      printerURL: "myawesomeprinter/",
      apiKey: "asd",
      settingsAppearance: {}
    });

    m.validate(function (err) {
      expectValidationError(err, ["sortIndex", "webSocketURL"], true);
      done();
    });
  });
});
