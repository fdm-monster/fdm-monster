import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { BambuClient } from "@/services/bambu/bambu.client";
import { BambuFtpAdapter } from "@/services/bambu/bambu-ftp.adapter";
import { BambuType } from "@/services/printer-api.interface";
import { LoginDto } from "@/services/interfaces/login.dto";

let container: AwilixContainer;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(BambuClient.name, () => {
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
    it("should create separate BambuClient instances for different printers", () => {
      const client1 = container.resolve<BambuClient>(DITokens.bambuClient);
      const client2 = container.resolve<BambuClient>(DITokens.bambuClient);

      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(BambuClient);
      expect(client2).toBeInstanceOf(BambuClient);
    });

    it("should create separate FTP adapter instances for each client", () => {
      const client1 = container.resolve<BambuClient>(DITokens.bambuClient);
      const client2 = container.resolve<BambuClient>(DITokens.bambuClient);

      expect(client1.ftp).not.toBe(client2.ftp);
      expect(client1.ftp).toBeInstanceOf(BambuFtpAdapter);
      expect(client2.ftp).toBeInstanceOf(BambuFtpAdapter);
    });

    it("should maintain separate connection states for multiple clients", () => {
      const client1 = container.resolve<BambuClient>(DITokens.bambuClient);
      const client2 = container.resolve<BambuClient>(DITokens.bambuClient);

      expect(client1.isConnected).toBe(false);
      expect(client2.isConnected).toBe(false);

      // Connection states are independent
      expect(client1.isConnected).toBe(client2.isConnected);
    });
  });

  describe("Constructor injection", () => {
    it("should inject BambuFtpAdapter instead of creating it", () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      // Verify the FTP adapter is injected
      expect(client.ftp).toBeDefined();
      expect(client.ftp).toBeInstanceOf(BambuFtpAdapter);
    });

    it("should have required dependencies injected", () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      expect(client.settingsStore).toBeDefined();
      expect(client.eventEmitter2).toBeDefined();
    });
  });

  describe("getApiVersion", () => {
    it("should return bambu version", async () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      const result = await client.getApiVersion(auth);

      expect(result).toHaveProperty("version");
      expect(result.version).toBe("bambu-1.0");
    });
  });

  describe("extractHost", () => {
    it("should extract hostname from full URL", async () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      // Use getApiVersion to test URL parsing indirectly
      const auth1 = { ...auth, printerURL: "http://192.168.1.100:80" };
      const auth2 = { ...auth, printerURL: "https://192.168.1.100" };
      const auth3 = { ...auth, printerURL: "192.168.1.100" };

      // All should work without throwing
      await expect(client.getApiVersion(auth1)).resolves.toBeDefined();
      await expect(client.getApiVersion(auth2)).resolves.toBeDefined();
      await expect(client.getApiVersion(auth3)).resolves.toBeDefined();
    });
  });

  describe("connect validation", () => {
    it("should throw error when access code is missing", async () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      const invalidAuth = { ...auth, password: "" };

      await expect(client.connect(invalidAuth)).rejects.toThrow(
        "Access code (password) is required for Bambu Lab printers",
      );
    });

    it("should throw error when access code is undefined", async () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      const invalidAuth = { ...auth, password: undefined as any };

      await expect(client.connect(invalidAuth)).rejects.toThrow(
        "Access code (password) is required for Bambu Lab printers",
      );
    });
  });

  describe("Connection state management", () => {
    it("should start with disconnected state", () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      expect(client.isConnected).toBe(false);
    });

    it("should provide access to FTP adapter", () => {
      const client = container.resolve<BambuClient>(DITokens.bambuClient);

      expect(client.ftp).toBeDefined();
      expect(client.ftp).toBeInstanceOf(BambuFtpAdapter);
    });
  });
});
