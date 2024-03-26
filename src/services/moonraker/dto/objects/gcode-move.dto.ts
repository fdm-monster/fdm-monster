export interface GcodeMoveDto {
  absolute_coordinates: boolean;
  absolute_extrude: boolean;
  extrude_factor: number;
  gcode_position: number[];
  homing_origin: number[];
  position: number[];
  speed: number;
  speed_factor: number;
}
