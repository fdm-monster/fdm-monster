import type { JobDto } from "@/services/moonraker/dto/server-history/job.dto";

export interface HistoryListDto {
  count: number;
  jobs: JobDto[];
}

export interface Metadata {
  size: number;
  modified: number;
  uuid: string;
  slicer: string;
  slicer_version: string;
  gcode_start_byte: number;
  gcode_end_byte: number;
  object_height: number;
  estimated_time: number;
  nozzle_diameter: number;
  layer_height: number;
  first_layer_height: number;
  first_layer_extr_temp: number;
  first_layer_bed_temp: number;
  filament_name: string;
  filament_type: string;
  filament_total: number;
  filament_weight_total: number;
}
