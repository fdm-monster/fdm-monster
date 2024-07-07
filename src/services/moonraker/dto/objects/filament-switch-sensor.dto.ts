// Docs might have outdated name https://moonraker.readthedocs.io/en/latest/printer_objects/#filament_switch_sensor-sensor_name
// Could be filament_motion_sensor now
export interface FilamentSwitchSensorDto {
  filament_detected: boolean;
  enabled: boolean;
}
