import { AxiosStatic } from "axios";
import { LoginDto } from "@/services/interfaces/login.dto";
import { PrinterObjectsQueryDto } from "@/services/moonraker/dto/printer-objects-query.dto";
import { ResultDto } from "@/services/moonraker/dto/result.dto";

export class MoonrakerSubscriptionClient {
  httpClient: AxiosStatic;

  constructor({ httpClient }: { httpClient: AxiosStatic }) {
    this.httpClient = httpClient;
  }

  // POST /printer/objects/subscribe?connection_id=123456789&gcode_move&extruder`
  subscribePrinterObjects(
    login: LoginDto,
    connectionId: string,
    query: Record<string, string[]> = {
      gcode_move: [],
      toolhead: [],
      extruder: [], // ["target", "temperature"],
    }
  ) {
    const queryString = Object.entries(query)
      .reduce((acc, [key, value]) => {
        if (value.length > 0) {
          acc.push(`${key}=${value.join(",")}`);
        } else {
          acc.push(key);
        }
        return acc;
      }, [])
      .join("&");
    return this.httpClient.post<ResultDto<PrinterObjectsQueryDto>>(
      `${login.printerURL}/printer/objects/subscribe?connection_id=${connectionId}&${queryString}`
    );
  }
}
