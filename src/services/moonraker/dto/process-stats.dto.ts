export interface ProcessStatsDto {
  moonraker_stats: MoonrakerStat[];
  throttled_state: ThrottledState;
  cpu_temp: number;
  network: Network;
  system_cpu_usage: SystemCpuUsage;
  system_uptime: number;
  websocket_connections: number;
}

export interface MoonrakerStat {
  time: number;
  cpu_usage: number;
  memory: number;
  mem_units: string;
}

export interface ThrottledState {
  bits: number;
  flags: any[];
}

export interface Network {
  lo: Lo;
  wlan0: Wlan0;
}

export interface Lo {
  rx_bytes: number;
  tx_bytes: number;
  bandwidth: number;
}

export interface Wlan0 {
  rx_bytes: number;
  tx_bytes: number;
  bandwidth: number;
}

export interface SystemCpuUsage {
  cpu: number;
  cpu0: number;
  cpu1: number;
  cpu2: number;
  cpu3: number;
}
