import { DITokens } from "@/container.tokens";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { CameraStreamService } from "@/services/orm/camera-stream.service";
import { setupTestApp } from "../test-server";

let cameraStreamService: ICameraStreamService;

beforeAll(async () => {
  const { container } = await setupTestApp(true);
  cameraStreamService = container.resolve<ICameraStreamService>(DITokens.cameraStreamService);
});

describe(CameraStreamService.name, () => {
  it("can create stream", async () => {
    const stream = await cameraStreamService.create({
      printerId: undefined,
      streamURL: "http://localhost:8080",
      name: "Test",
    });
    expect(stream).toBeTruthy();

    expect(cameraStreamService.toDto(stream).streamURL).toBe("http://localhost:8080");
  });
});
