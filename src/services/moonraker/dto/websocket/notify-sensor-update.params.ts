export interface SensorUpdateParams {
  [k: string]: SensorState;
}

export interface SensorState {
  humidity: number;
  temperature: number;
}
