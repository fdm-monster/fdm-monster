import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { MongooseQueueService } from "@/services/mongoose/queue.service";
import { TypeOrmQueueService } from "@/services/orm/queue.service";
import { QueueState } from "@/state/queue.state";
import { QueueCleanupTask } from "@/tasks/queue-cleanup.task";
import * as fs from 'fs';
import * as path from 'path';

let container: AwilixContainer;
let mongooseQueueService: MongooseQueueService;
let typeOrmQueueService: TypeOrmQueueService;
let queueState: QueueState;
let queueCleanupTask: QueueCleanupTask;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  mongooseQueueService = container.resolve<MongooseQueueService>(DITokens.queueService);
  typeOrmQueueService = container.resolve<TypeOrmQueueService>(DITokens.queueService);
  queueState = container.resolve<QueueState>(DITokens.queueState);
  queueCleanupTask = container.resolve<QueueCleanupTask>(DITokens.queueCleanupTask);
});

beforeEach(async () => {
  // Clear queue state
  queueState.clearQueue();
  
  // Clear queue items from both databases
  const items = await mongooseQueueService.getAllQueueItems();
  for (const item of items) {
    await mongooseQueueService.deleteQueueItem(item.filePath);
    await typeOrmQueueService.deleteQueueItem(item.filePath);
  }
});

describe(QueueCleanupTask.name, () => {
  const testGcodePath = "test/api/test-data/sample.gcode";
  const queueDir = path.join(process.cwd(), 'media', 'queue');

  it("should clean up orphaned queue entries", async () => {
    // Create a queue item
    const queueItem = {
      orderIndex: 0,
      filePath: path.join(queueDir, "test.gcode"),
      fileSize: 1000,
      thumbnailBase64: "test",
      printedCount: 0,
      totalPrintsRequired: 1,
      uploadDate: new Date()
    };

    // Add to both databases and state
    await mongooseQueueService.createQueueItem(queueItem);
    await typeOrmQueueService.createQueueItem(queueItem);
    queueState.addToQueue(queueItem);

    // Verify item exists
    let queueItems = await mongooseQueueService.getAllQueueItems();
    expect(queueItems).toHaveLength(1);

    // Run cleanup task
    await queueCleanupTask.run();

    // Verify item is removed
    queueItems = await mongooseQueueService.getAllQueueItems();
    expect(queueItems).toHaveLength(0);
  });

  it("should not remove valid queue entries", async () => {
    // Create queue directory if it doesn't exist
    if (!fs.existsSync(queueDir)) {
      fs.mkdirSync(queueDir, { recursive: true });
    }

    // Create a test file
    const filePath = path.join(queueDir, "test.gcode");
    fs.writeFileSync(filePath, "test content");

    // Create a queue item
    const queueItem = {
      orderIndex: 0,
      filePath,
      fileSize: 1000,
      thumbnailBase64: "test",
      printedCount: 0,
      totalPrintsRequired: 1,
      uploadDate: new Date()
    };

    // Add to both databases and state
    await mongooseQueueService.createQueueItem(queueItem);
    await typeOrmQueueService.createQueueItem(queueItem);
    queueState.addToQueue(queueItem);

    // Run cleanup task
    await queueCleanupTask.run();

    // Verify item still exists
    const queueItems = await mongooseQueueService.getAllQueueItems();
    expect(queueItems).toHaveLength(1);

    // Clean up test file
    fs.unlinkSync(filePath);
  });

  it("should handle multiple orphaned entries", async () => {
    // Create multiple queue items
    const queueItems = [
      {
        orderIndex: 0,
        filePath: path.join(queueDir, "test1.gcode"),
        fileSize: 1000,
        thumbnailBase64: "test1",
        printedCount: 0,
        totalPrintsRequired: 1,
        uploadDate: new Date()
      },
      {
        orderIndex: 1,
        filePath: path.join(queueDir, "test2.gcode"),
        fileSize: 2000,
        thumbnailBase64: "test2",
        printedCount: 0,
        totalPrintsRequired: 1,
        uploadDate: new Date()
      }
    ];

    // Add to both databases and state
    for (const item of queueItems) {
      await mongooseQueueService.createQueueItem(item);
      await typeOrmQueueService.createQueueItem(item);
      queueState.addToQueue(item);
    }

    // Verify items exist
    let items = await mongooseQueueService.getAllQueueItems();
    expect(items).toHaveLength(2);

    // Run cleanup task
    await queueCleanupTask.run();

    // Verify all items are removed
    items = await mongooseQueueService.getAllQueueItems();
    expect(items).toHaveLength(0);
  });
}); 