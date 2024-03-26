export interface SensorsMeasurementsDto {
  sensor1: SensorMeasurementsDto;
  [k: string]: SensorMeasurementsDto;
}

export interface SensorMeasurementsDto {
  value1: number[];
  value2: number[];
  [k: string]: number[];
}
