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
    <v-btn
      :color="printer.printerState.colour.name"
      :disabled="isPrinterPrinting()"
      fab
      small
      @click.c.capture.native.stop="togglePrinterConnection()"
    >
      <v-icon>usb</v-icon>
    </v-btn>
  </v-badge>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend";
import { usePrintersStore } from "@/store/printers.store";

export default defineComponent({
  name: "PrinterConnectionAction",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
    };
  },
  async created() {},
  async mounted() {},
  props: {
    printer: Object as PropType<Printer>,
  },
  computed: {
    printerId() {
      return this.printer!.id;
    },
  },
  methods: {
    isPrinterOperational() {
      return this.printersStore.isPrinterOperational(this.printerId);
    },
    isPrinterPrinting() {
      return this.printersStore.isPrinterPrinting(this.printerId);
    },
    async togglePrinterConnection() {
      if (this.isPrinterOperational()) {
        return PrintersService.sendPrinterDisconnectCommand(this.printerId);
      }
      await PrintersService.sendPrinterConnectCommand(this.printerId);
    },
  },
});
</script>
