export interface HistoryListDto {
  count: number;
  jobs: JobDto[];
}

export interface JobDto {
  job_id: string;
  exists: boolean;
  end_time: number;
  filament_used: number;
  filename: string;
  metadata: Metadata;
  print_duration: number;
  status: string;
  start_time: number;
  total_duration: number;
}

export interface Metadata {}
