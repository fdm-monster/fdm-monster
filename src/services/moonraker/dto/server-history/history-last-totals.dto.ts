import { JobTotals } from "@/services/moonraker/dto/server-history/history-totals.dto";

export interface HistoryLastTotalsDto {
  last_totals: JobTotals;
}
