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
  const fileFilterCallBack: (error: Error | null) => void = (err: any) => {
    if (err) throw err;
  };

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

  it("should be able to start tracking upload", async () => {
    multerService.startTrackingSession({} as Express.Multer.File, 1);

    const trackedSessions = multerService.getSessions();
    expect(trackedSessions.current).not.toHaveLength(0);
  });

  it("should provide multer filter middleware", async () => {
    const result = multerService.getMulterGCodeFileFilter(false);
    expect(typeof result).toBe("function");
  });

  it("gcode filter should throw on non-gcode extension", async () => {
    const incorrectFile = { originalname: "file.gco" } as Express.Multer.File;

    expect(() =>
      multerService.multerFileFilter([".gcode", ".bgcode"])(null, incorrectFile, fileFilterCallBack)
    ).toThrow();
  });

  it("gcode filter should accept gcode extension", async () => {
    const correctFile = { originalname: "file.gcode" } as Express.Multer.File;

    expect(() =>
      multerService.multerFileFilter([".gcode", ".bgcode"])(null, correctFile, fileFilterCallBack)
    ).not.toThrow();
  });
});
