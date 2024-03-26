export interface SpoolmanStatusDto {
  spoolman_connected: boolean;
  pending_reports: PendingReport[];
  spool_id: number;
}

export interface PendingReport {
  spool_id: number;
  filament_used: number;
}
