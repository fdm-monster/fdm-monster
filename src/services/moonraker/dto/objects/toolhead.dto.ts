export interface ToolheadDto {
  homed_axes: string;
  axis_minimum: number[];
  axis_maximum: number[];
  print_time: number;
  stalls: number;
  estimated_print_time: number;
  extruder: string;
  position: number[];
  max_velocity: number;
  max_accel: number;
  minimum_cruise_ratio: number;
  square_corner_velocity: number;
}
