<template>
  <v-btn
    class="ma-2"
    color="primary"
    fab
    small
    @click.c.capture.native.stop="openPrinterURL(printer)"
  >
    <v-icon>directions</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend";

export default defineComponent({
  name: "PrinterUrlAction",
  props: {
    printer: Object as PropType<Printer>,
  },
  computed: {
    printerId() {
      return this.printer!.id;
    },
  },
  methods: {
    openPrinterURL(printer: Printer) {
      PrintersService.openPrinterURL(printer.printerURL);
    },
  },
});
</script>
