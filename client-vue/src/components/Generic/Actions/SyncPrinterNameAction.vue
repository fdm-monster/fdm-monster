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
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { PrinterSettingsService } from "@/backend/printer-settings.service";

@Component({
  components: {},
})
export default class SyncPrinterNameAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  async syncPrinterName(printer: Printer) {
    await PrinterSettingsService.syncPrinterName(printer.id);
  }
}
</script>
