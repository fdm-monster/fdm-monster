import { Repository } from 'typeorm';
import { Queue } from '../../entities/queue.entity';
import { AppDataSource } from '../../data-source';

export class TypeOrmQueueService {
  private repository: Repository<Queue>;

  constructor() {
    this.repository = AppDataSource.getRepository(Queue);
  }

  async createQueueItem(item: Omit<Queue, 'id' | 'uploadDate'>): Promise<Queue> {
    const queueItem = this.repository.create(item);
    return await this.repository.save(queueItem);
  }

  async getQueueItem(filePath: string): Promise<Queue | null> {
    return await this.repository.findOne({ where: { filePath } });
  }

  async getAllQueueItems(): Promise<Queue[]> {
    return await this.repository.find({
      order: { orderIndex: 'ASC' }
    });
  }

  async updateQueueItem(filePath: string, updates: Partial<Queue>): Promise<Queue | null> {
    await this.repository.update({ filePath }, updates);
    return await this.getQueueItem(filePath);
  }

  async deleteQueueItem(filePath: string): Promise<boolean> {
    const result = await this.repository.delete({ filePath });
    return result.affected ? result.affected > 0 : false;
  }

  async getNextOrderIndex(): Promise<number> {
    const lastItem = await this.repository.findOne({
      where: {},
      order: { orderIndex: 'DESC' }
    });
    return lastItem ? lastItem.orderIndex + 1 : 0;
  }
} 