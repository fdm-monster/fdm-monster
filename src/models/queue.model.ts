import { Schema, model } from 'mongoose';

export interface IQueue {
  orderIndex: number;
  filePath: string;
  fileSize: number;
  thumbnailBase64?: string;
  printedCount: number;
  uploadDate: Date;
  totalPrintsRequired: number;
}

const queueSchema = new Schema<IQueue>({
  orderIndex: { type: Number, required: true },
  filePath: { type: String, required: true, unique: true },
  fileSize: { type: Number, required: true },
  thumbnailBase64: { type: String },
  printedCount: { type: Number, required: true, default: 0 },
  uploadDate: { type: Date, required: true, default: Date.now },
  totalPrintsRequired: { type: Number, required: true, default: 1 }
});

export const Queue = model<IQueue>('Queue', queueSchema); 