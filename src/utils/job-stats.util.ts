import { PrintJob, PrintStatistics } from "@/entities/print-job.entity";

export function calculateJobDuration(startedAt: Date | null, endedAt: Date = new Date()): number | null {
  if (!startedAt) {
    return null;
  }
  return (endedAt.getTime() - startedAt.getTime()) / 1000;
}

export interface StatisticsUpdateOptions {
  progress?: number;
  failureReason?: string;
  failureTime?: Date;
}

export function initializeOrUpdateStatistics(
  job: PrintJob,
  endedAt: Date = new Date(),
  options: StatisticsUpdateOptions = {},
): PrintStatistics {
  const actualPrintTimeSeconds = calculateJobDuration(job.startedAt, endedAt);

  if (!job.statistics) {
    return {
      startedAt: job.startedAt,
      endedAt,
      actualPrintTimeSeconds,
      progress: options.progress ?? job.progress ?? null,
      failureReason: options.failureReason,
      failureTime: options.failureTime,
    };
  } else {
    job.statistics.endedAt = endedAt;
    job.statistics.actualPrintTimeSeconds = actualPrintTimeSeconds;

    if (options.progress !== undefined) {
      job.statistics.progress = options.progress;
    }

    if (options.failureReason !== undefined) {
      job.statistics.failureReason = options.failureReason;
      job.statistics.failureTime = options.failureTime ?? endedAt;
    }

    return job.statistics;
  }
}

export function updateStatisticsForCompletion(job: PrintJob, endedAt: Date = new Date()): void {
  job.statistics = initializeOrUpdateStatistics(job, endedAt, { progress: 100 });
  job.endedAt = endedAt;
  job.progress = 100;
}

export function updateStatisticsForFailure(job: PrintJob, reason: string, endedAt: Date = new Date()): void {
  job.statistics = initializeOrUpdateStatistics(job, endedAt, {
    failureReason: reason,
    failureTime: endedAt,
  });
  job.endedAt = endedAt;
  job.statusReason = reason;
}

export function updateStatisticsForCancellation(
  job: PrintJob,
  reason: string = "Print cancelled by user",
  endedAt: Date = new Date(),
): void {
  job.statistics = initializeOrUpdateStatistics(job, endedAt);
  job.endedAt = endedAt;
  job.statusReason = reason;
}
