import { JobQueueState, QueuedJob } from "@/services/moonraker/dto/job-queue/job-queue-status.dto";

export interface JobQueueChangedParams {
  action: "state_changed" | "jobs_added" | "jobs_removed" | "job_loaded";
  updated_queue: QueuedJob[];
  queue_state: JobQueueState;
}
