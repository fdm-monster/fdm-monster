import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { MulterService } from "@/services/core/multer.service";
import { existsSync, readdirSync } from "fs";
import { Dirent, PathLike } from "node:fs";

type ReaddirSyncWithDirent = (path: PathLike, options: { withFileTypes: true }) => Dirent[];

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmSync: vi.fn(),
}));

let container;
let multerService: MulterService;

beforeAll(async () => {
  container = configureContainer();
  multerService = container.resolve(DITokens.multerService);
});

describe("MulterService", () => {
  it("should clear folder", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked<ReaddirSyncWithDirent>(readdirSync).mockReturnValue([
      {
        name: "somefile.gcode",
        isDirectory: () => false,
      } as Dirent,
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
