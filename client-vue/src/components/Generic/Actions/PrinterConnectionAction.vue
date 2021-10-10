<template>
  <v-badge
    v-if="printer.enabled"
    :color="isPrinterOperational(printer) ? 'green' : 'red'"
    bordered
    class="ma-2"
    overlap
  >
    <template v-slot:badge>
      <v-icon v-if="isPrinterOperational(printer)">check</v-icon>
      <v-icon v-else>close</v-icon>
    </template>
    <v-btn :color="printer.printerState.colour.name" fab small @click="togglePrinterConnection()" :disabled="isPrinterPrinting()">
      <v-icon>usb</v-icon>
    </v-btn>
  </v-badge>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend";

@Component({
  components: { FileList: FileControlList }
})
export default class PrinterConnectionAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  isPrinterOperational() {
    return this.printer?.printerState?.flags.operational;
  }

  isPrinterPrinting() {
    return this.printer?.printerState?.flags.printing;
  }

  async togglePrinterConnection() {
    if (this.isPrinterOperational()) {
      return PrintersService.sendPrinterDisconnectCommand(this.printerId);
    }

    await PrintersService.sendPrinterConnectCommand(this.printerId);
  }
}
</script>
