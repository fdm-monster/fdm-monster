import { MoonrakerApi } from "@/services/moonraker.api";
import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../test-server";
import { AwilixContainer } from "awilix";
import nock from "nock";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";
import { createTestPrinter } from "../api/test-data/create-printer";
import TestAgent from "supertest/lib/agent";
import { Test } from "supertest";

let printerApiFactory: PrinterApiFactory;
let container: AwilixContainer;
let request: TestAgent<Test>;

beforeAll(async () => {
  ({ container, request } = await setupTestApp(true));
  printerApiFactory = container.resolve(DITokens.printerApiFactory);
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(PrinterApiFactory.name, () => {
  it("should construct octoprint printer api", async () => {
    const printer = printerApiFactory.getScopedPrinter({
      printerType: OctoprintType,
      printerURL: "http://asd.com",
      apiKey: "123",
    });
    expect(printer.type).toBe(OctoprintType);
  });

  it("should construct moonraker printer api", async () => {
    const printer = printerApiFactory.getScopedPrinter({
      printerType: MoonrakerType,
      printerURL: "http://asd.com",
      apiKey: "123",
    });
    expect(printer.type).toBe(MoonrakerType);
  });

  it("should get version of moonraker api", async () => {
    const printerDto = await createTestPrinter(request);

    const printerUrl = "http://url.com";
    nock(printerUrl).get("/api/version").reply(200, { server: "1.2.3" });

    const printer = printerApiFactory.getById(printerDto.id);
    const version = await printer.getVersion();
    expect(version).toEqual("1.2.3");
  });
});
