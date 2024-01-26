import { IdType } from "@/shared.constants";
import { ConnectionDto } from "@/services/octoprint/dto/connection.dto";
import { KeyDiffCache } from "@/utils/cache/key-diff.cache";

export type PrinterConnectionsCacheDto = Record<IdType, ConnectionDto>;

export class PrinterConnectionCache extends KeyDiffCache<ConnectionDto> {
  async getPrinterConnection(printerId: IdType, connection: ConnectionDto) {
    await this.setKeyValue(printerId, connection);
  }

  async setPrinterConnection(printerId: IdType, connection: ConnectionDto) {
    await this.setKeyValue(printerId, connection);
  }
}
