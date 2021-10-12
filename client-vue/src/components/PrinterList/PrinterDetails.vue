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
    <v-row>
      <v-col>
        Name: {{ printer.printerName }} <br/>
        URL: {{ printer.printerURL }} <br/>
        Host: {{ printer.hostState.state }} - <small><strong>{{ printer.hostState.desc }}</strong></small> <br/>
        WebSocket: {{ printer.webSocketState.colour }} <br/>
        Printer: {{ printer.printerState.state }} <br/>
        Files: {{ getPrinterFileCount() }} <br/>
        Sort Index: {{ printer.sortIndex }}
      </v-col>
      <v-col>
        <RefreshFilesAction :printer="printer" class="d-flex justify-end"/>
        <PrinterDeleteAction :printer="printer" class="d-flex justify-end"/>
      </v-col>
    </v-row>

    <FileList :file-list="printer.fileList" :printer-id="printerId"/>
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import PrinterDeleteAction from "@/components/Generic/Actions/PrinterDeleteAction.vue";
import { printersState } from "@/store/printers.state";
import RefreshFilesAction from "@/components/Generic/Actions/RefreshFilesAction.vue";

@Component({
  components: { FileList: FileControlList, PrinterDeleteAction, RefreshFilesAction }
})
export default class PrinterDetails extends Vue {
  @Prop() printer: Printer;
  dragging = false;

  get printerId() {
    return this.printer.id;
  }

  getPrinterFileCount() {
    return this.printer.fileList?.fileCount || 0;
  }

  async addFile(e: DragEvent) {
    if (!e.dataTransfer) return;
    this.dragging = false;

    await printersState.dropUploadPrinterFile({
      printerId: this.printerId,
      files: e.dataTransfer.files
    });
  }
}
</script>

<style>
.slow-background {
  transition: background-color 0.5s ease;
}
</style>
