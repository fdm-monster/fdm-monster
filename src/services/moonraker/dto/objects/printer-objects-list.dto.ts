export const objects = {
  bed_mesh: "bed_mesh",
  configfile: "configfile",
  display_status: "display_status",
  // Can be extruder1 etc
  extruder: "extruder",
  fan: "fan",
  // Needs a name to be appended "filament_switch_sensor sensor_name"
  filament_switch_sensor: "filament_switch_sensor",
  // Needs a name to be appended "filament_motion_sensor sensor_name"
  filament_motion_sensor: "filament_motion_sensor",
  gcode: "gcode",
  gcode_macro: "gcode_macro",
  gcode_move: "gcode_move",
  heater_bed: "heater_bed",
  heaters: "heaters",
  idle_timeout: "idle_timeout",
  mcu: "mcu",
  motion_report: "motion_report",
  // Needs a name to be appended "output_pin pin_name"
  output_pin: "output_pin",
  pause_resume: "pause_resume",
  print_stats: "print_stats",
  stepper_enable: "stepper_enable",
  system_stats: "system_stats",
  // Needs a name to be appended "temperature_fan fan_name"
  temperature_fan: "temperature_fan",
  // Needs a name to be appended "temperature_sensor sensor_name"
  temperature_sensor: "temperature_sensor",
  toolhead: "toolhead",
  virtual_sdcard: "virtual_sdcard",
  webhooks: "webhooks",
} as const;
export const objectsList = Object.keys(objects);
export type KnownPrinterObject = keyof typeof objects;
export type PrinterObject = keyof typeof objects | string;

export interface PrinterAvailableObjects {
  objects: PrinterObject[];
}

// Full list from virtual klipper:
//   "gcode",
//   "webhooks",
//   "configfile",
//   "mcu",
//   "gcode_macro START_PRINT",
//   "gcode_macro END_PRINT",
//   "gcode_macro CANCEL_PRINT",
//   "gcode_macro PAUSE",
//   "gcode_macro RESUME",
//   "gcode_macro M117",
//   "gcode_macro M600",
//   "gcode_macro LOAD_FILAMENT",
//   "gcode_macro UNLOAD_FILAMENT",
//   "gcode_macro M104",
//   "gcode_macro M109",
//   "heaters",
//   "heater_bed",
//   "gcode_macro M140",
//   "gcode_macro M190",
//   "fan",
//   "heater_fan heater_fan",
//   "stepper_enable",
//   "controller_fan controller_fan",
//   "filament_motion_sensor runout_sensor",
//   "output_pin output_pin",
//   "gcode_macro GET_TIMELAPSE_SETUP",
//   "gcode_macro _SET_TIMELAPSE_SETUP",
//   "gcode_macro TIMELAPSE_TAKE_FRAME",
//   "gcode_macro _TIMELAPSE_NEW_FRAME",
//   "gcode_macro HYPERLAPSE",
//   "gcode_macro TIMELAPSE_RENDER",
//   "gcode_macro TEST_STREAM_DELAY",
//   "pause_resume",
//   "display_status",
//   "gcode_move",
//   "exclude_object",
//   "print_stats",
//   "virtual_sdcard",
//   "firmware_retraction",
//   "bed_mesh",
//   "motion_report",
//   "query_endstops",
//   "idle_timeout",
//   "system_stats",
//   "manual_probe",
//   "toolhead",
//   "extruder"
