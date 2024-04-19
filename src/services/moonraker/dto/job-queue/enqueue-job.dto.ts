export interface EnqueueJobDto {
  filenames: string[];
  // Set this to true and existing queue is cleared
  reset: boolean;
}
