export interface ExtruderDto {
  temperature: number;
  target: number;
  power: number;
  can_extrude: boolean;
  pressure_advance: number;
  smooth_time: number;
  // Missing in docs https://moonraker.readthedocs.io/en/latest/printer_objects/#extruder
  motion_queue: null | any;
}
