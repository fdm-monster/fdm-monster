import { Queue, IQueue } from '../../models/queue.model';

export class MongooseQueueService {
  async createQueueItem(item: Omit<IQueue, 'uploadDate'>): Promise<IQueue> {
    const queueItem = new Queue(item);
    return await queueItem.save();
  }

  async getQueueItem(filePath: string): Promise<IQueue | null> {
    return await Queue.findOne({ filePath });
  }

  async getAllQueueItems(): Promise<IQueue[]> {
    return await Queue.find().sort({ orderIndex: 1 });
  }

  async updateQueueItem(filePath: string, updates: Partial<IQueue>): Promise<IQueue | null> {
    return await Queue.findOneAndUpdate(
      { filePath },
      { $set: updates },
      { new: true }
    );
  }

  async deleteQueueItem(filePath: string): Promise<boolean> {
    const result = await Queue.deleteOne({ filePath });
    return result.deletedCount > 0;
  }

  async getNextOrderIndex(): Promise<number> {
    const lastItem = await Queue.findOne().sort({ orderIndex: -1 });
    return lastItem ? lastItem.orderIndex + 1 : 0;
  }
} 