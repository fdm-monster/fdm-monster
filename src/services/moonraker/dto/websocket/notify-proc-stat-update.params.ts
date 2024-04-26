import { MoonrakerStat, Network, SystemCpuUsage } from "@/services/moonraker/dto/process-stats.dto";

export interface NotifyProcStatUpdateParams {
  moonraker_stats: MoonrakerStat[];
  cpu_temp: number | null;
  network: Network;
  system_cpu_usage: SystemCpuUsage;
  websocket_connections: number;
}
