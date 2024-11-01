import { Printer } from "@/models";
import { expectValidationError } from "../extensions";

describe("printer-schema", function () {
  it("should be valid for required properties", async () => {
    const m = new Printer({
      apiKey: "asd",
      printerURL: "myawesomeprinter/",
      name: "Printer name",
    });

    await m.validate();
  });

  it("should be invalid if URLs, and apiKey properties are empty", async () => {
    const m = new Printer({});

    await expect(async () => await m.validate()).rejects.toBeTruthy();
  });
});
