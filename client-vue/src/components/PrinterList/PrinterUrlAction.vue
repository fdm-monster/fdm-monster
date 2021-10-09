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
import FileList from "@/components/PrinterList/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: { FileList }
})
export default class PrinterUrlAction extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
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
