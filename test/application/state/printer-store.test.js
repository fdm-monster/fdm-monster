jest.mock("../../../server/services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const DITokens = require("../../../server/container.tokens");
const { configureContainer } = require("../../../server/container");
const { ValidationException } = require("../../../server/exceptions/runtime.exceptions");

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
  const invalidNewPrinter = {
    apiKey: "asd",
    webSocketURL: null,
    printerURL: null,
    camURL: null
  };

  const weakNewPrinter = {
    apiKey: "asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0"
  };

  const weakNewPrinter2 = {
    apiKey: "1C0KVOKWEAKWEAK8VBGAR",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0"
  };

  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    webSocketURL: "ws://asd.com/",
    printerURL: "https://asd.com:81",
    camURL: "http://asd.com:81"
  };

  it("should return with empty octoprint versions array", async () => {
    const returnedStats = await printersStore.getOctoPrintVersions();
    expect(returnedStats).toEqual([]);
  });

  it("should avoid adding invalid printer", async () => {
    await expect(async () => await printersStore.addPrinter({})).rejects.toBeInstanceOf(
      ValidationException
    );

    expect(() => printersStore.addPrinter(invalidNewPrinter)).rejects.toHaveErrors({
      apiKey: {
        rule: "length"
      },
      webSocketURL: {
        rule: "required"
      }
    });

    await expect(async () => await printersStore.addPrinter(weakNewPrinter)).rejects.toBeInstanceOf(
      ValidationException
    );

    await expect(async () => await printersStore.addPrinter(weakNewPrinter2)).rejects.toBeDefined();
  });

  it("should be able to add and flatten new printer", async () => {
    let frozenObject = await printersStore.addPrinter(validNewPrinter);
    const flatState = printersStore.getPrinterFlat(frozenObject.id);
    expect(Object.isFrozen(flatState)).toBeTruthy();
  });

  it("should be able to add printer - receiving an state object back", async () => {
    let unfrozenStateInstance = await printersStore.addPrinter(validNewPrinter);
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
          name: expect.any(String)
        }
      },
      hostState: {
        state: expect.any(String),
        desc: expect.any(String),
        colour: {
          category: expect.any(String),
          hex: expect.any(String),
          name: expect.any(String)
        }
      },
      webSocketState: {
        desc: expect.any(String),
        colour: expect.any(String) // ?
      },
      stepSize: expect.any(Number),
      alerts: null
    });
  });
});
