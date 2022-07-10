const fs = require("fs");
jest.mock("fs");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");

let container;
let multerService;

beforeAll(async () => {
  container = configureContainer();
  multerService = container.resolve(DITokens.multerService);
});

describe("MulterService", () => {
  it("should find file", () => {
    expect(multerService.fileExists("file", "storage")).toBeFalsy();
  });

  it("should clear folder", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([
      {
        name: "somefile.gcode",
        isDirectory: () => false
      }
    ]);
    multerService.clearUploadsFolder();
  });
});
