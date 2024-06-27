export interface McuDto {
  mcu_version: string;
  mcu_build_versions: string;
  mcu_constants: McuConstants;
  last_stats: LastStats;
}

export interface McuConstants {
  ADC_MAX: number;
  BUS_PINS_spi: string;
  BUS_PINS_twi: string;
  CLOCK_FREQ: number;
  MCU: string;
  PWM_MAX: number;
  RECEIVE_WINDOW: number;
  RESERVE_PINS_serial: string;
  SERIAL_BAUD: number;
  STATS_SUMSQ_BASE: number;
}

export interface LastStats {
  mcu_awake: number;
  mcu_task_avg: number;
  mcu_task_stddev: number;
  bytes_write: number;
  bytes_read: number;
  bytes_retransmit: number;
  bytes_invalid: number;
  send_seq: number;
  receive_seq: number;
  retransmit_seq: number;
  srtt: number;
  rttvar: number;
  rto: number;
  ready_bytes: number;
  upcoming_bytes: number;
  freq: number;
}
