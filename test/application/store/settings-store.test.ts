import { closeDatabase, connect } from "../../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { FilesStore } from "@/state/files.store";
import { PrinterFilesService } from "@/services/printer-files.service";
import { PrinterService } from "@/services/printer.service";
import { PrinterCache } from "@/state/printer.cache";
import { SettingsStore } from "@/state/settings.store";

let container: AwilixContainer;
let filesStore: FilesStore;
let printerFilesService: PrinterFilesService;
let printerService: PrinterService;
let printerCache: PrinterCache;
let settingsStore: SettingsStore;

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  if (container) await container.dispose();
  container = configureContainer();
  filesStore = container.resolve(DITokens.filesStore);
  printerFilesService = container.resolve(DITokens.printerFilesService);
  printerService = container.resolve(DITokens.printerService);
  printerCache = container.resolve(DITokens.printerCache);
  settingsStore = container.resolve(DITokens.settingsStore);
});

afterAll(async () => {
  await closeDatabase();
});

describe(SettingsStore.name, () => {
  it("should persist jwt secret and expiresIn", async () => {
    await settingsStore.persistOptionalCredentialSettings("123123123", "123d");
    const creds = await settingsStore.getCredentialSettings();
    expect(creds.jwtExpiresIn).toBe(123);
    expect(creds.refreshTokenAttempts).toBe(50);
  });
});
