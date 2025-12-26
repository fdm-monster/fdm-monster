export interface TrackedUpload {
  correlationToken: string;
  printerId: number;
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
