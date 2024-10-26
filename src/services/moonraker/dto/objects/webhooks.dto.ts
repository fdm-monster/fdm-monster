import { PrinterInfoState } from "@/services/moonraker/dto/printer-info.dto";

export interface WebhooksDto {
  state: PrinterInfoState;
  state_message: string;
}
