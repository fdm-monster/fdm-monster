import { IQueue } from '../models/queue.model';

export class QueueState {
  private queueItems: Map<string, IQueue> = new Map();

  public addToQueue(item: IQueue): void {
    this.queueItems.set(item.filePath, item);
  }

  public removeFromQueue(filePath: string): void {
    this.queueItems.delete(filePath);
  }

  public getQueueItem(filePath: string): IQueue | undefined {
    return this.queueItems.get(filePath);
  }

  public getAllQueueItems(): IQueue[] {
    return Array.from(this.queueItems.values());
  }

  public clearQueue(): void {
    this.queueItems.clear();
  }

  public updateQueueItem(filePath: string, updates: Partial<IQueue>): void {
    const item = this.queueItems.get(filePath);
    if (item) {
      this.queueItems.set(filePath, { ...item, ...updates });
    }
  }
} 