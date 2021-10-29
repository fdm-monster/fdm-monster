import { registerAs } from "@nestjs/config";
import { MonitoringConfigurationModel } from "./models/monitoring-configuration.model";

export const MONITORING_OPTIONS = "MONITORING_MODULE_OPTIONS";

export const MonitoringConfig = registerAs(MONITORING_OPTIONS, (): MonitoringConfigurationModel => {
  return {
  };
});
