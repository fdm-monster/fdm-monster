import { beforeAll, describe, expect, it } from "@jest/globals";
const fs = require("fs");
jest.mock("fs");
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { MulterService } from "@/services/multer.service";

let container;
let multerService: MulterService;

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
        isDirectory: () => false,
      },
    ]);
    multerService.clearUploadsFolder();
  });

  it("should be able to start tracking upload", async () => {
    multerService.startTrackingSession({});

    const trackedSessions = multerService.getSessions();
    expect(trackedSessions.current).not.toHaveLength(0);
    expect(trackedSessions.done).toHaveLength(0);
    expect(trackedSessions.failed).toHaveLength(0);
  });

  it("should provide multer filter middleware", async () => {
    const result = multerService.getMulterGCodeFileFilter(false);
    expect(typeof result).toBe("function");
  });

  it("gcode filter should throw on non-gcode extension", async () => {
    const incorrectFile = { originalname: "file.gco" };

    expect(() =>
      multerService.multerFileFilter(".gcode")(null, incorrectFile, (err, result) => {
        if (err) throw err;
        return result;
      })
    ).toThrow();
  });

  it("gcode filter should accept gcode extension", async () => {
    const correctFile = { originalname: "file.gcode" };

    expect(() =>
      multerService.multerFileFilter(".gcode")(null, correctFile, (err, result) => {
        if (err) throw err;
        return result;
      })
    ).not.toThrow();
  });
});
