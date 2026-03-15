import type { SensorDto } from "@/services/moonraker/dto/server-sensors/sensor-info.dto";

export interface SensorListDto {
  sensors: Sensors;
}

export interface Sensors {
  sensor1: SensorDto;
  [k: string]: SensorDto;
}
