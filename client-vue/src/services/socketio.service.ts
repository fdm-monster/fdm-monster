import { io, Socket } from "socket.io-client";
import Vue from "vue";
import { VueBus } from "vue-bus";
import {
  SocketIoTestPrinterMessage,
  SocketIoUpdateMessage,
} from "@/models/sse-messages/printer-sse-message.model";
import { sseGroups, sseMessageGlobal, sseTestPrinterUpdate } from "@/event-bus/sse.events";
import { InfoEventType, uploadMessageEvent } from "@/event-bus/alert.events";
import { updatedPrinterEvent } from "@/event-bus/printer.events";
import { useOutletCurrentStore } from "@/store/outlet-current.store";
import { usePrintersStore } from "@/store/printers.store";
import { apiBase } from "@/backend/base.service";

enum IO_MESSAGES {
  LegacyUpdate = "legacy-update",
  LegacyPrinterTest = "legacy-printer-test",
  CompletionEvent = "completion-event",
  HostState = "host-state",
  ApiAccessibility = "api-accessibility",
}

export class SocketIoService {
  socket: Socket;
  $bus: VueBus;
  printersStore = usePrintersStore();

  setupSocketConnection($bus: VueBus) {
    this.socket = io(apiBase); // Same-origin policy);
    this.$bus = $bus;
    this.socket.on(IO_MESSAGES.LegacyUpdate, (data) => this.onMessage(JSON.parse(data)));
    this.socket.on(IO_MESSAGES.LegacyPrinterTest, (data) =>
      this.onPrinterTestMessage(JSON.parse(data))
    );
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  onPrinterTestMessage(message: SocketIoTestPrinterMessage) {
    if (message.testPrinter) {
      // Emit a specific testing session update
      const { testPrinter, testProgress } = message;
      if (!testPrinter?.correlationToken) return;

      this.$bus.emit(sseTestPrinterUpdate(testPrinter.correlationToken), {
        testPrinter,
        testProgress,
      });
    }
  }

  onMessage(message: SocketIoUpdateMessage) {
    if (message.printerGroups) {
      this.printersStore.savePrinterGroups(message.printerGroups);
      this.$bus.emit(sseGroups, message.printerGroups);
    }

    if (message.trackedUploads) {
      this.$bus.emit(uploadMessageEvent, InfoEventType.UPLOAD_BACKEND, message.trackedUploads);
    }

    if (message.floors) {
      this.printersStore.savePrinterFloors(message.floors);
    }

    if (message.printers) {
      this.printersStore.setPrinters(message.printers);

      // Emit the global update
      this.$bus.emit(sseMessageGlobal, message);

      message.printers.forEach((p) => {
        if (!p.id) return;
        this.$bus.emit(updatedPrinterEvent(p.id), p);
      });
    }

    const outletStore = useOutletCurrentStore();
    if (message.outletCurrentValues) {
      outletStore.setOutletCurrentValues(message.outletCurrentValues);
    }
  }
}
