import { MongooseQueueService } from '../services/mongoose/queue.service';
import { TypeOrmQueueService } from '../services/orm/queue.service';
import { QueueState } from '../state/queue.state';
import * as fs from 'fs';
import * as path from 'path';
import { ILoggerFactory } from '@/handlers/logger-factory';
import { LoggerService } from '@/handlers/logger';
import { TaskService } from '@/services/interfaces/task.interfaces';

export class QueueCleanupTask implements TaskService {
  private readonly queueDir = path.join(process.cwd(), 'media', 'queue');
  private readonly logger: LoggerService;

  constructor(
    private readonly queueService: MongooseQueueService | TypeOrmQueueService,
    private readonly queueState: QueueState,
    loggerFactory: ILoggerFactory
  ) {
    this.logger = loggerFactory(QueueCleanupTask.name);
  }

  public async run(): Promise<void> {
    await this.cleanupOrphanedQueueEntries();
  }

  public async cleanupOrphanedQueueEntries(): Promise<void> {
    try {
      const queueItems = await this.queueService.getAllQueueItems();
      
      for (const item of queueItems) {
        if (!fs.existsSync(item.filePath)) {
          // Remove from databases and state
          await this.queueService.deleteQueueItem(item.filePath);
          this.queueState.removeFromQueue(item.filePath);
          
          this.logger.log(`Removed orphaned queue entry for file: ${item.filePath}`);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up orphaned queue entries:', error);
    }
  }
} 