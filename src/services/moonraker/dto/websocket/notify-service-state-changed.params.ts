import { ServiceState } from "@/services/moonraker/dto/machine/machine-system-info.dto";

export type NotifyServiceStateChangedParams = {
  [k in "klipper" | "klipper_mcu" | "moonraker"]: ServiceState;
};
