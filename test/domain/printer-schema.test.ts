import { Printer } from "@/models";
import { expectValidationError } from "../extensions";

describe("printer-schema", function () {
  it("should be valid for required properties", function (done) {
    const m = new Printer({
      apiKey: "asd",
      printerURL: "myawesomeprinter/",
      name: "Printer name",
    });

    m.validate(function (err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it("should be invalid if URLs, and apiKey properties are empty", function (done) {
    const m = new Printer({});

    m.validate(function (err) {
      expectValidationError(err, ["name", "printerURL", "apiKey"], true);
      done();
    });
  });
});
