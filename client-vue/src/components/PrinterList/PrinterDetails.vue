<template>
  <v-container
    v-if="printer"
    :style="dragging ? 'background-color:red' : ''"
    class="slow-background"
    transition="scale-transition"
    @dragenter="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="addFile"
    @dragover.prevent="dragging = true"
  >
    <PrinterDeleteAction :printer="printer" />
    Name: {{ printer.printerName }} <br />
    URL: {{ printer.printerURL }}

    <FileList :file-list="printer.fileList" :printer-id="printerId" />
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import PrinterDeleteAction from "@/components/Generic/Actions/PrinterDeleteAction.vue";
import { ACTIONS } from "@/store/printers/printers.actions";

@Component({
  components: { FileList: FileControlList, PrinterDeleteAction }
})
export default class PrinterDetails extends Vue {
  @Prop() printer: Printer;
  dragging = false;

  get printerId() {
    return this.printer.id;
  }

  addFile(e: DragEvent) {
    if (!e.dataTransfer) return;
    this.dragging = false;

    this.$store.dispatch(ACTIONS.dropUploadPrinterFile, {
      printerId: this.printerId,
      domFiles: e.dataTransfer.files
    });
  }
}
</script>

<style>
.slow-background {
  transition: background-color 0.5s ease;
}
</style>
