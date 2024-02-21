import { IdType } from "@/shared.constants";
import { ConnectionDto } from "@/services/octoprint/dto/connection.dto";
import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { printerEvents } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";

export class PrinterConnectionCache extends KeyDiffCache<ConnectionDto> {
  eventEmitter2: EventEmitter2;

  constructor({ eventEmitter2 }: { eventEmitter2: EventEmitter2 }) {
    super();
    this.eventEmitter2 = eventEmitter2;

    this.subscribeToEvents();
  }

  async handlePrintersDeleted({ printerIds }: { printerIds: IdType[] }) {
    await this.deleteKeysBatch(printerIds);
  }

  async getPrinterConnection(printerId: IdType, connection: ConnectionDto) {
    await this.setKeyValue(printerId, connection);
  }

  async setPrinterConnection(printerId: IdType, connection: ConnectionDto) {
    await this.setKeyValue(printerId, connection);
  }

  private subscribeToEvents() {
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }
}
