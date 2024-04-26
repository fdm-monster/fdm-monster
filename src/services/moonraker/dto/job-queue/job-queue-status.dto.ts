export type JobQueueState = "ready" | "loading" | "starting" | "paused";
export interface JobQueueStatusDto {
  queued_jobs: QueuedJob[];
  queue_state: JobQueueState;
}

export interface QueuedJob {
  filename: string;
  job_id: string;
  // unix timestamp
  time_added: number;
  // seconds
  time_in_queue: number;
}
