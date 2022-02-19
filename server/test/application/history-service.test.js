jest.mock("../../server/services/octoprint/octoprint-api.service");
const { configureContainer } = require("../../container");
const Filament = require("../../models/Filament");
const DITokens = require("../../container.tokens");

const dbHandler = require("../db-handler");
let container;
let historyService;
let printerStateFactory;
let octoPrintClientMock;
let printerInstance;

const legalURL = "http://prusa/";
const goodAPIKey = "123456ABCD123456ABCD123456ABCDEF";
const basePath = "./images/historyService";
const testFilename = "test.file";
const testIllegalURL = "totally.illegal test.url";

beforeAll(async () => {
  await dbHandler.connect();
  // FS should be mocked as late as possible in order to give MongoDB Memory Server a chance
  jest.mock("fs");
  container = configureContainer();
  const settingsStore = container.resolve(DITokens.settingsStore);
  await settingsStore.loadSettings();
  historyService = container.resolve(DITokens.historyService);
  printerStateFactory = container.resolve(DITokens.printerStateFactory);
  octoPrintClientMock = container.resolve(DITokens.octoPrintApiService);

  printerInstance = await printerStateFactory.create({
    _id: "fake",
    _doc: {
      printerURL: legalURL,
      apiKey: goodAPIKey
    }
  });
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("HistoryService", () => {
  const testCorrectURLs = [
    "https://url.myurl:80",
    "https://url.myurl:443",
    "http://url.myurl?asd=123",
    "http://url.myurl/?asd=123", // Python/OP doesnt like closed routes...
    "http://url.myurl?asd=123"
  ];
  const testId = 'totally.illegal id with code fs.removeFile("~/.ssh/authorizedKeys")';

  test.skip("should be able to download an OctoPrint timelapse", async () => {
    const response = await historyService.downloadTimeLapse(printerInstance, testFilename, testId);
    expect(response).toContain(`${basePath}/timelapses/${testId}-${testFilename}`);
  });

  it("should prevent downloading an OctoPrint thumbnail with wrong URL", async () => {
    // false positive
    await expect(
      async () =>
        await historyService
          .grabThumbnail(printerInstance, testIllegalURL, testFilename, testId)
          .toThrow()
    );
  });
});
