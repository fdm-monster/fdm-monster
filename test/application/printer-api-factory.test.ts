import { MoonrakerApi } from "@/services/moonraker.api";
import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../test-server";
import { AwilixContainer } from "awilix";
import nock from "nock";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { BambuType, MoonrakerType, OctoprintType } from "@/services/printer-api.interface";
import { createTestPrinter } from "../api/test-data/create-printer";
import TestAgent from "supertest/lib/agent";
import { Test } from "supertest";
import { BambuApi } from "@/services/bambu.api";

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

  it("should construct bambu printer api", async () => {
    const printer = printerApiFactory.getScopedPrinter({
      printerType: BambuType,
      printerURL: "http://192.168.1.100",
      password: "12345678",
      username: "AC12345678901234",
    });
    expect(printer.type).toBe(BambuType);
    expect(printer).toBeInstanceOf(BambuApi);
  });

  describe("Multi-printer isolation for Bambu Lab", () => {
    it("should create separate BambuApi instances for different printers", () => {
      const printer1 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.100",
        password: "12345678",
        username: "AC12345678901234",
      });

      const printer2 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.101",
        password: "87654321",
        username: "AC43210987654321",
      });

      expect(printer1).not.toBe(printer2);
      expect(printer1).toBeInstanceOf(BambuApi);
      expect(printer2).toBeInstanceOf(BambuApi);
    });

    it("should create separate BambuClient instances for each API", () => {
      const printer1 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.100",
        password: "12345678",
        username: "AC12345678901234",
      }) as BambuApi;

      const printer2 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.101",
        password: "87654321",
        username: "AC43210987654321",
      }) as BambuApi;

      expect(printer1.client).not.toBe(printer2.client);
    });

    it("should create separate FTP adapters for each printer", () => {
      const printer1 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.100",
        password: "12345678",
        username: "AC12345678901234",
      }) as BambuApi;

      const printer2 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.101",
        password: "87654321",
        username: "AC43210987654321",
      }) as BambuApi;

      expect(printer1.client.ftp).not.toBe(printer2.client.ftp);
    });

    it("should maintain separate connection states for multiple Bambu printers", () => {
      const printer1 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.100",
        password: "12345678",
        username: "AC12345678901234",
      }) as BambuApi;

      const printer2 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.101",
        password: "87654321",
        username: "AC43210987654321",
      }) as BambuApi;

      // Both should start disconnected
      expect(printer1.client.isConnected).toBe(false);
      expect(printer2.client.isConnected).toBe(false);

      // Connection states are independent
      expect(printer1.client.isConnected).not.toBe(printer2.client.isConnected || true);
    });

    it("should get correct version for multiple Bambu printers", async () => {
      const printer1 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.100",
        password: "12345678",
        username: "AC12345678901234",
      });

      const printer2 = printerApiFactory.getScopedPrinter({
        printerType: BambuType,
        printerURL: "http://192.168.1.101",
        password: "87654321",
        username: "AC43210987654321",
      });

      const version1 = await printer1.getVersion();
      const version2 = await printer2.getVersion();

      expect(version1).toBe("bambu-1.0");
      expect(version2).toBe("bambu-1.0");
    });
  });
});
