export interface TemperatureStoreDto {
  extruder: Extruder;
  "temperature_fan my_fan": TemperaturesFan;
  "temperature_sensor my_sensor": TemperaturesSensor;
}

export interface Extruder {
  temperatures: number[];
  targets: number[];
  powers: number[];
}

export interface TemperaturesFan {
  temperatures: number[];
  targets: number[];
  speeds: number[];
}

export interface TemperaturesSensor {
  temperatures: number[];
}
