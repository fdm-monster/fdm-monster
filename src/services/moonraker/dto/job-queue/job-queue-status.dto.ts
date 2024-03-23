export interface JobQueueStatusDto {
  queued_jobs: QueuedJob[];
  queue_state: "ready" | "loading" | "starting" | "paused" | string;
}

export interface QueuedJob {
  filename: string;
  job_id: string;
  // unix timestamp
  time_added: number;
  // seconds
  time_in_queue: number;
}
