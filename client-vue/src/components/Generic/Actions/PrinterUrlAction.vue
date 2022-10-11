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
import Component from "vue-class-component";
import Vue from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend";

@Component({
  components: { FileList: FileControlList },
})
export default class PrinterUrlAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  openPrinterURL(printer: Printer) {
    PrintersService.openPrinterURL(printer.printerURL);
  }
}
</script>
