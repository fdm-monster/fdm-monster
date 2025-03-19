import { IdType } from "@/shared.constants";

export interface TrackedUpload {
  correlationToken: string;
  printerId: IdType;
  startedAt: number;
  multerFile: {
    originalname: string;
    [k: string]: any;
  };
  progress: number;
  completed: boolean;
  completedAt?: number;
  success?: boolean;
  reason?: string;
}
