import { PrinterSocketStore } from "@/state/printer-socket.store";

export class PrinterWebsocketTask {
  constructor(
    private readonly printerSocketStore: PrinterSocketStore
  ) {
  }

  async run() {
    await this.printerSocketStore.reconnectPrinterSockets();
  }
}
