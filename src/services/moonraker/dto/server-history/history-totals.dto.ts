export interface HistoryTotalsDto {
  job_totals: JobTotals;
}

export interface JobTotals {
  total_jobs: number;
  total_time: number;
  total_print_time: number;
  total_filament_used: number;
  longest_job: number;
  longest_print: number;
}
