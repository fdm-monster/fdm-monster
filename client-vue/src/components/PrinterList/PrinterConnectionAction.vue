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
    <v-btn :color="printer.printerState.colour.name" fab small>
      <v-icon>usb</v-icon>
    </v-btn>
  </v-badge>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileList from "@/components/PrinterList/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: { FileList }
})
export default class PrinterConnectionAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  isPrinterOperational() {
    return this.printer?.printerState?.flags.operational;
  }

  openPrinterURL(printer: Printer) {
    const printerURL = printer.printerURL;
    if (!printerURL) {
      return;
    }
    window.open(printerURL);
  }
}
</script>
