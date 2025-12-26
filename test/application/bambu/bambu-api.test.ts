import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { BambuApi } from "@/services/bambu.api";
import { BambuType } from "@/services/printer-api.interface";
import { LoginDto } from "@/services/interfaces/login.dto";
import { PrinterApiFactory } from "@/services/printer-api.factory";

let container: AwilixContainer;
let printerApiFactory: PrinterApiFactory;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  printerApiFactory = container.resolve(DITokens.printerApiFactory);
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(BambuApi.name, () => {
  const printerURL = "http://192.168.1.100";
  const accessCode = "12345678";
  const serial = "AC12345678901234";
  const auth: LoginDto = {
    printerURL,
    password: accessCode,
    username: serial,
    printerType: BambuType,
  };

  describe("Multi-printer isolation", () => {
    it("should create separate BambuApi instances", () => {
      const api1 = printerApiFactory.getScopedPrinter(auth);
      const api2 = printerApiFactory.getScopedPrinter(auth);

      expect(api1).not.toBe(api2);
      expect(api1).toBeInstanceOf(BambuApi);
      expect(api2).toBeInstanceOf(BambuApi);
    });

    it("should have separate BambuClient instances per API", () => {
      const api1 = printerApiFactory.getScopedPrinter(auth) as BambuApi;
      const api2 = printerApiFactory.getScopedPrinter(auth) as BambuApi;

      expect(api1.client).not.toBe(api2.client);
    });

    it("should have separate FTP adapters per API instance", () => {
      const api1 = printerApiFactory.getScopedPrinter(auth) as BambuApi;
      const api2 = printerApiFactory.getScopedPrinter(auth) as BambuApi;

      expect(api1.client.ftp).not.toBe(api2.client.ftp);
    });
  });

  describe("Printer type", () => {
    it("should return BambuType", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(api.type).toBe(BambuType);
    });
  });

  describe("getVersion", () => {
    it("should return bambu version", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      const version = await api.getVersion();

      expect(version).toBe("bambu-1.0");
    });
  });

  describe("setPrinterId", () => {
    it("should set printer ID for MQTT adapter access", () => {
      const api = printerApiFactory.getScopedPrinter(auth) as BambuApi;
      const printerId = 123;

      expect(() => api.setPrinterId(printerId)).not.toThrow();
    });
  });

  describe("MQTT operations require printer ID", () => {
    it("should throw error when printer ID not set for startPrint", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      await expect(api.startPrint("test.3mf")).rejects.toThrow("Printer ID not set. Cannot access MQTT adapter.");
    });

    it("should throw error when printer ID not set for pausePrint", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      await expect(api.pausePrint()).rejects.toThrow("Printer ID not set. Cannot access MQTT adapter.");
    });

    it("should throw error when printer ID not set for resumePrint", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      await expect(api.resumePrint()).rejects.toThrow("Printer ID not set. Cannot access MQTT adapter.");
    });

    it("should throw error when printer ID not set for cancelPrint", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      await expect(api.cancelPrint()).rejects.toThrow("Printer ID not set. Cannot access MQTT adapter.");
    });

    it("should throw error when printer ID not set for sendGcode", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      await expect(api.sendGcode("G28")).rejects.toThrow("Printer ID not set. Cannot access MQTT adapter.");
    });

    it("should throw error when printer ID not set for getReprintState", async () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      await expect(api.getReprintState()).rejects.toThrow("Printer ID not set. Cannot access MQTT adapter.");
    });
  });

  describe("Unsupported operations", () => {
    it("should throw error on restartServer", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.restartServer()).toThrow();
    });

    it("should throw error on restartHost", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.restartHost()).toThrow();
    });

    it("should throw error on restartPrinterFirmware", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.restartPrinterFirmware()).toThrow();
    });

    it("should throw error on movePrintHead", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.movePrintHead({ x: 10, y: 10 })).toThrow();
    });

    it("should throw error on homeAxes", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.homeAxes({ x: true, y: true })).toThrow();
    });

    it("should throw error on getFileChunk", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.getFileChunk("test.3mf", 0, 100)).toThrow();
    });

    it("should throw error on deleteFolder", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.deleteFolder("/test")).toThrow();
    });

    it("should throw error on getSettings", () => {
      const api = printerApiFactory.getScopedPrinter(auth);

      expect(() => api.getSettings()).toThrow();
    });
  });

  describe("Login setter", () => {
    it("should allow updating login credentials", () => {
      const api = printerApiFactory.getScopedPrinter(auth) as BambuApi;

      const newAuth: LoginDto = {
        ...auth,
        printerURL: "http://192.168.1.101",
      };

      api.login = newAuth;

      expect(api.printerLogin).toBe(newAuth);
    });
  });
});
