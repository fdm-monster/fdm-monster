jest.mock("../../../services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const DITokens = require("../../../container.tokens");
const { configureContainer } = require("../../../container");
const { ValidationException } = require("../../../exceptions/runtime.exceptions");
const { CATEGORY } = require("../../../constants/state.constants");
const { validNewPrinterState } = require("../test-data/printer.data");

let container;
let printersStore;
let filesStore;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  await container.resolve(DITokens.settingsStore).loadSettings();

  printersStore = container.resolve(DITokens.printersStore);
  filesStore = container.resolve(DITokens.filesStore);
  await printersStore.loadPrintersStore();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("PrintersStore", () => {
  const invalidNewPrinterState = {
    apiKey: "asd",
    webSocketURL: null,
    printerURL: null,
    camURL: null,
  };

  const weakNewPrinter = {
    apiKey: "asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0",
  };

  const weakNewPrinter2 = {
    apiKey: "1C0KVOKWEAKWEAK8VBGAR",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0",
  };

  it("should return with empty octoprint versions array", async () => {
    const returnedStats = await printersStore.getOctoPrintVersions();
    expect(returnedStats).toEqual([]);
  });

  it("should avoid adding invalid printer", async () => {
    await expect(async () => await printersStore.addPrinter({})).rejects.toBeInstanceOf(
      ValidationException
    );

    expect(() => printersStore.addPrinter(invalidNewPrinterState)).rejects.toHaveErrors({
      apiKey: {
        rule: "length",
      },
      webSocketURL: {
        rule: "required",
      },
    });

    await expect(async () => await printersStore.addPrinter(weakNewPrinter)).rejects.toBeInstanceOf(
      ValidationException
    );

    await expect(async () => await printersStore.addPrinter(weakNewPrinter2)).rejects.toBeDefined();
  });

  it("should be able to add and flatten new printer", async () => {
    let frozenObject = await printersStore.addPrinter(validNewPrinterState);
    const flatState = printersStore.getPrinterFlat(frozenObject.id);
    expect(Object.isFrozen(flatState)).toBeTruthy();
  });

  it("should be able to add printer - receiving an state object back", async () => {
    let unfrozenStateInstance = await printersStore.addPrinter(validNewPrinterState);
    expect(Object.isFrozen(unfrozenStateInstance)).toBeFalsy();

    // Need the store in order to have files to refer to
    await filesStore.loadFilesStore();

    const flatState = unfrozenStateInstance.toFlat();
    expect(Object.isFrozen(flatState)).toBeTruthy();

    expect(flatState).toMatchObject({
      id: expect.any(String),
      printerState: {
        state: expect.any(String),
        desc: expect.any(String),
        colour: {
          category: expect.any(String),
          hex: expect.any(String),
          name: expect.any(String),
        },
      },
      hostState: {
        state: expect.any(String),
        desc: expect.any(String),
        colour: {
          category: expect.any(String),
          hex: expect.any(String),
          name: expect.any(String),
        },
      },
      webSocketState: {
        desc: expect.any(String),
        colour: expect.any(String), // ?
      },
      stepSize: expect.any(Number),
    });
  });

  it("should load printerStore with a saved printer", async () => {
    await printersStore.addPrinter(validNewPrinterState);
    await printersStore.loadPrintersStore();
  });

  it("should update api user from printerStore", async () => {
    const newApiUserName = "testname";
    const newPrinter = await printersStore.addPrinter(validNewPrinterState);
    const result = await printersStore.updateApiUserName(newPrinter.id, newApiUserName);
    // Should not return currentUser
    expect(result.currentUser).toBeUndefined();
  });

  it("should skip teardown test printer when already undefined", async () => {
    await printersStore.deleteTestPrinter();
  });

  it("should get undefined test printer from store", async () => {
    expect(printersStore.getTestPrinter()).toBeUndefined();
  });

  it("should get whether printerState is authed", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);

    expect(printerState.isAdapterAuthed()).toBeFalsy();
  });

  it("should get printerState apiAccessibility", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);

    expect(printerState.getApiAccessibility()).toMatchObject({
      accessible: true,
      retryable: true,
      reason: null,
    });
  });

  it("should get printerState api accessible and retryable", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);
    expect(printerState.isApiAccessible()).toBeTruthy();
    expect(printerState.isApiRetryable()).toBeTruthy();
    expect(printerState.shouldRetryConnect()).toBeTruthy();
  });

  it("should get printerState octoprint undefined stored version when disconnected", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);
    expect(printerState.getOctoPrintVersion()).toBeUndefined();
  });

  it("should get printerState url", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);
    expect(printerState.getURL()).toBeTruthy();
  });

  it("should get printerState url", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);
    expect(printerState.getStateCategory()).toEqual(CATEGORY.Offline);
  });

  it("should get printerState sortIndex", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);
    printerState.getSortIndex();
  });

  it("should update printerState systemInfo", async () => {
    let printerState = await printersStore.addPrinter(validNewPrinterState);
    expect(printerState.updateSystemInfo({})).toBeUndefined();
  });
});
