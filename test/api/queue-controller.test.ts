import { setupTestApp } from "../test-server";
import { expectInvalidResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import { QueueController } from "@/controllers/queue.controller";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { MongooseQueueService } from "@/services/mongoose/queue.service";
import { TypeOrmQueueService } from "@/services/orm/queue.service";
import { QueueState } from "@/state/queue.state";
import * as fs from 'fs';
import TestAgent from "supertest/lib/agent";
import { MulterService } from "@/services/core/multer.service";

const defaultRoute = AppConstants.apiRoute + "/queue";
const uploadRoute = `${defaultRoute}/upload`;
const getQueueRoute = `${defaultRoute}`;
const deleteQueueItemRoute = (filePath: string) => `${defaultRoute}/${filePath}`;
const updateQueueItemRoute = (filePath: string) => `${defaultRoute}/${filePath}`;

let request: TestAgent<Test>;
let container: AwilixContainer;
let queueService: MongooseQueueService | TypeOrmQueueService;
let queueState: QueueState;
let multerService: MulterService;

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  queueService = container.resolve<MongooseQueueService | TypeOrmQueueService>(DITokens.queueService);
  queueState = container.resolve<QueueState>(DITokens.queueState);
  multerService = container.resolve<MulterService>(DITokens.multerService);
});

beforeEach(async () => {
  // Clear queue state
  queueState.clearQueue();
  
  // Clear queue items from the database
  const items = await queueService.getAllQueueItems();
  for (const item of items) {
    await queueService.deleteQueueItem(item.filePath);
  }
});

describe(QueueController.name, () => {
  const testGcodePath = "test/api/test-data/sample.gcode";
  const testThumbnailBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  it("should return empty queue on GET when no items exist", async () => {
    const response = await request.get(getQueueRoute).send();
    expectOkResponse(response, []);
  });

  it("should upload gcode file and add to queue", async () => {
    const response = await request.post(uploadRoute)
      .field("thumbnailBase64", testThumbnailBase64)
      .field("totalPrintsRequired", "1")
      .attach("file", testGcodePath);

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty("filePath");
    expect(response.body).toHaveProperty("orderIndex");
    expect(response.body).toHaveProperty("fileSize");
    expect(response.body).toHaveProperty("thumbnailBase64", testThumbnailBase64);
    expect(response.body).toHaveProperty("printedCount", 0);
    expect(response.body).toHaveProperty("totalPrintsRequired", 1);

    // Verify item exists in queue
    const queueItems = await queueService.getAllQueueItems();
    expect(queueItems).toHaveLength(1);
    expect(queueItems[0].filePath).toBe(response.body.filePath);
  });

  it("should deny upload when no file is provided", async () => {
    const response = await request.post(uploadRoute)
      .field("thumbnailBase64", testThumbnailBase64)
      .field("totalPrintsRequired", "1");
    expectInvalidResponse(response);
  });

  it("should delete queue item", async () => {
    // First upload a file
    const uploadResponse = await request.post(uploadRoute)
      .field("thumbnailBase64", testThumbnailBase64)
      .field("totalPrintsRequired", "1")
      .attach("file", testGcodePath);
    
    const filePath = uploadResponse.body.filePath;

    // Then delete it
    const response = await request.delete(deleteQueueItemRoute(filePath)).send();
    expect(response.statusCode).toEqual(200);

    // Verify item is removed from queue
    const queueItems = await queueService.getAllQueueItems();
    expect(queueItems).toHaveLength(0);
  });

  it("should return 404 when deleting non-existent queue item", async () => {
    const response = await request.delete(deleteQueueItemRoute("nonexistent.gcode")).send();
    expect(response.statusCode).toEqual(404);
  });

  it("should update queue item", async () => {
    // First upload a file
    const uploadResponse = await request.post(uploadRoute)
      .field("thumbnailBase64", testThumbnailBase64)
      .field("totalPrintsRequired", "1")
      .attach("file", testGcodePath);
    
    const filePath = uploadResponse.body.filePath;

    // Then update it
    const updates = {
      totalPrintsRequired: 3,
      printedCount: 1
    };

    const response = await request.patch(updateQueueItemRoute(filePath))
      .send(updates);
    
    expect(response.statusCode).toEqual(200);
    expect(response.body.totalPrintsRequired).toBe(3);
    expect(response.body.printedCount).toBe(1);

    // Verify item is updated in queue
    const queueItems = await queueService.getAllQueueItems();
    expect(queueItems).toHaveLength(1);
    expect(queueItems[0].totalPrintsRequired).toBe(3);
    expect(queueItems[0].printedCount).toBe(1);
  });

  it("should return 404 when updating non-existent queue item", async () => {
    const response = await request.patch(updateQueueItemRoute("nonexistent.gcode"))
      .send({ totalPrintsRequired: 3 });
    expect(response.statusCode).toEqual(404);
  });
}); 
