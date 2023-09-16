import { connect } from "../db-handler";
import { configureContainer } from "@/container";
import { Printer } from "@/models";
import { DITokens } from "@/container.tokens";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { testPrinterData } from "./test-data/printer.data";

let container;
let printerService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
});

afterAll(async () => {
  return Printer.deleteMany({});
});

describe("PrinterService", () => {
  it("Must be able to rename a created printer", async () => {
    const printer = await printerService.create(testPrinterData);
    const updatedName = "newName";
    const printerUpdate = {
      ...testPrinterData,
      settingsAppearance: {
        name: updatedName,
      },
    };

    await printerService.update(printer.id, printerUpdate);
    const foundPrinter = await Printer.findOne({ id: printer.id });
    expect(foundPrinter.settingsAppearance.name).toEqual(updatedName);
  });
});
