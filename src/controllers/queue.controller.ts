import { Request, Response } from "express";
import { MongooseQueueService } from "@/services/mongoose/queue.service";
import { TypeOrmQueueService } from "@/services/orm/queue.service";
import { QueueState } from "@/state/queue.state";
import { before, DELETE, GET, PATCH, POST, route } from "awilix-express";
import { authenticate, authorizeRoles, permission } from "@/middleware/authenticate";
import { PERMS, ROLES } from "@/constants/authorization.constants";
import { AppConstants } from "@/server.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { ensureDirExists, superRootPath } from "@/utils/fs.utils";
import { MulterService } from "@/services/core/multer.service";
import { join } from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { validateInput } from "@/handlers/validators";
import { z } from "zod";

@route(AppConstants.apiRoute + "/queue")
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class QueueController {
  private readonly queueDir = join(superRootPath(), AppConstants.defaultQueueFolder);
  private readonly logger: LoggerService;

  constructor(
    private readonly queueService: MongooseQueueService | TypeOrmQueueService,
    private readonly queueState: QueueState,
    loggerFactory: ILoggerFactory,
    private readonly multerService: MulterService,
  ) {
    this.logger = loggerFactory(QueueController.name);
    ensureDirExists(this.queueDir);
  }

  @POST()
  @route("/upload")
  @before(permission(PERMS.PrinterFiles.Upload))
  async uploadGcode(req: Request, res: Response) {
    const files = await this.multerService.multerLoadFileAsync(
      req,
      res,
      AppConstants.defaultAcceptedGcodeExtensions,
      false,
    );

    // Multer has loaded the formdata
    const { thumbnailBase64, totalPrintsRequired } = await validateInput(req.body, z.object({
      thumbnailBase64: z.string(),
      totalPrintsRequired: z.string(),
    }));

    const file = files[0];
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = file.originalname;
    const fullPath = join(this.queueDir, filePath);
    await writeFile(fullPath, file.buffer);

    const orderIndex = await this.queueService.getNextOrderIndex();
    const queueItem = {
      orderIndex,
      filePath,
      fileSize: file.size,
      thumbnailBase64: req.body.thumbnailBase64,
      printedCount: 0,
      totalPrintsRequired: parseInt(req.body.totalPrintsRequired) || 1,
    };

    const savedItem = await this.queueService.createQueueItem(queueItem);
    this.queueState.addToQueue(savedItem);

    res.status(201).json(savedItem);
  }

  @GET()
  @route("/")
  async getQueue(req: Request, res: Response) {
    try {
      const items = await this.queueService.getAllQueueItems();
      res.json(items);
    } catch (error) {
      this.logger.error("Error getting queue:", error);
      res.status(500).json({ error: "Failed to get queue" });
    }
  }

  @DELETE()
  @route("/:filePath")
  async deleteQueueItem(req: Request, res: Response) {
    try {
      const { filePath } = req.params;
      const fullPath = join(this.queueDir, filePath);

      // Delete file from filesystem
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }

      // Delete from database and state
      const deleted = await this.queueService.deleteQueueItem(filePath);
      if (!deleted) {
        return res.status(404).json({ error: "Queue item not found" });
      }
      this.queueState.removeFromQueue(filePath);

      res.status(200).json({ message: "Queue item deleted successfully" });
    } catch (error) {
      this.logger.error("Error deleting queue item:", error);
      res.status(500).json({ error: "Failed to delete queue item" });
    }
  }

  @PATCH()
  @route("/:filePath")
  async updateQueueItem(req: Request, res: Response) {
    try {
      const { filePath } = req.params;
      const fullPath = join(this.queueDir, filePath);
      const updates = req.body;

      const updatedItem = await this.queueService.updateQueueItem(filePath, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Queue item not found" });
      }
      this.queueState.updateQueueItem(filePath, updates);

      res.json(updatedItem);
    } catch (error) {
      this.logger.error("Error updating queue item:", error);
      res.status(500).json({ error: "Failed to update queue item" });
    }
  }
} 
