import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { MulterService } from "@/services/core/multer.service";

const fs = require("fs");
jest.mock("fs");

let container;
let multerService: MulterService;

beforeAll(async () => {
  container = configureContainer();
  multerService = container.resolve(DITokens.multerService);
});

describe("MulterService", () => {
  it("should clear folder", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([
      {
        name: "somefile.gcode",
        isDirectory: () => false,
      },
    ]);
    multerService.clearUploadsFolder();
  });

  it("should be able to start tracking upload", async () => {
    multerService.startTrackingSession({} as Express.Multer.File, 1);

    const trackedSessions = multerService.getSessions();
    expect(trackedSessions.current).not.toHaveLength(0);
  });

  it("should provide multer filter middleware", async () => {
    const result = multerService.getMulterGCodeFileFilter(false);
    expect(typeof result).toBe("function");
  });
});
