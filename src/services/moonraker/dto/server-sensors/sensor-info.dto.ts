export interface SensorDto {
  id: string;
  friendly_name: string;
  type: string;
  values: SensorValues;
}

export interface SensorValues {
  value1: number;
  value2: number;
  [k: string]: number;
}
