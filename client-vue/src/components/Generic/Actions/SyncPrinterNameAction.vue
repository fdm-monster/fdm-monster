<template>
  <v-btn
    class="ma-2"
    color="primary"
    fab
    small
    @click.c.capture.native.stop="syncPrinterName(printer)"
  >
    <v-icon>badge</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";
import { PrinterSettingsService } from "@/backend/printer-settings.service";

export default defineComponent({
  name: "SyncPrinterNameAction",
  props: {
    printer: Object as PropType<Printer>,
  },
  computed: {
    printerId() {
      return this.printer!.id;
    },
  },
  methods: {
    async syncPrinterName(printer: Printer) {
      await PrinterSettingsService.syncPrinterName(printer.id);
    },
  },
});
</script>
