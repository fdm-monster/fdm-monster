export interface ServerFileMetadataDto {
  print_start_time: any;
  job_id: any;
  size: number;
  modified: number;
  slicer: string;
  slicer_version: string;
  layer_height: number;
  first_layer_height: number;
  object_height: number;
  filament_total: number;
  estimated_time: number;
  thumbnails: Thumbnail[];
  first_layer_bed_temp: number;
  first_layer_extr_temp: number;
  gcode_start_byte: number;
  gcode_end_byte: number;
  filename: string;
}

export interface Thumbnail {
  width: number;
  height: number;
  size: number;
  relative_path: string;
}
