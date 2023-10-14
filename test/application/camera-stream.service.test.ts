import { closeDatabase, connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { CameraService } from "@/services/camera-stream.service";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { MongoIdType } from "@/shared.constants";

let cameraStreamService: ICameraStreamService;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  cameraStreamService = container.resolve<ICameraStreamService<MongoIdType>>(DITokens.cameraStreamService);
});

afterAll(async () => {
  await closeDatabase();
});

describe(CameraService.name, () => {
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
