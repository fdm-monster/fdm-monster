import { IdType } from "../../shared.constants";

export interface TrackedUpload {
  correlationToken: string;
  printerId: IdType;
  startedAt: number;
  multerFile: {
    originalname: string;
    [k: string]: any;
  };
  progress: {
    percent: number;
    [k: string]: number;
  };
  succeededAt?: number;
  failedAt?: number;
  reason?: string;
  complete: boolean;
}
