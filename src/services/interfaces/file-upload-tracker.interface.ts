import { IdType } from "@/shared.constants";

export interface TrackedUpload {
  correlationToken: string;
  printerId: IdType;
  startedAt: number;
  multerFile: {
    originalname: string;
    [k: string]: any;
  };
  progress: number | null;
  completed: boolean;
  completedAt: number | null;
  success: boolean | null;
  reason: string | null;
}
