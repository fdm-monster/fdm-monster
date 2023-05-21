const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const { Printer } = require("../../models/Printer");
const DITokens = require("../../container.tokens");
const { flattenedDutchRALMap } = require("../../constants/ral-color-map.constants");

let container;
let printerFilesService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerFilesService = container.resolve(DITokens.printerFilesService);
});

afterAll(async () => {
  return Printer.deleteMany({});
});

describe("PrinterFileService", () => {
  it("Flattened color RAL map should not be empty", () => {
    expect(flattenedDutchRALMap.length).toBeGreaterThan(10);
    expect(flattenedDutchRALMap[27]).toMatchObject({ applegreen: 6027 });
  });
});
