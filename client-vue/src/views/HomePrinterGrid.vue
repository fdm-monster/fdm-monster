<template>
  <div>
    <Toolbar />

    <v-banner v-drop-upload="{ printers: selectedPrinters }">
      <v-row style="margin-bottom: -5px">
        <v-col style="padding: 5px 0 0 15px">
          <v-chip-group class="d-inline-block">
            <v-chip v-if="selectedPrinters.length === 0" small>No printers selected</v-chip>
            <v-chip
              v-for="selectedPrinter in selectedPrinters"
              :key="selectedPrinter.id"
              close
              color="primary"
              small
              @click="openPrinter(selectedPrinter)"
              @click:close="deselectPrinter(selectedPrinter)"
            >
              {{ selectedPrinter.printerName }}
            </v-chip>
          </v-chip-group>
        </v-col>
        <v-col align="right" style="padding: 0">
          <v-chip-group v-if="selectedFile" class="float-end">
            <v-chip close @click:close="deselectFile()">
              {{ selectedFile.name }}
              <strong class="pl-1">{{ formatBytes(selectedFile.size) }}</strong>
            </v-chip>
          </v-chip-group>
          <br />
          <v-btn
            :color="hasPrintersSelected ? 'primary' : 'secondary'"
            x-small
            @click="clearSelectedPrinters()"
          >
            Clear all ({{ selectedPrinters.length }})
          </v-btn>
          <v-btn class="ml-2" color="primary" x-small @click="$refs.fileUpload.click()">
            Select gcode file
          </v-btn>
          <v-btn :disabled="!selectedFile" class="ml-2" color="green" x-small @click="uploadFile()">
            Upload gcode file
          </v-btn>
          <input
            ref="fileUpload"
            :multiple="false"
            accept=".gcode"
            style="display: none"
            type="file"
            @change="filesSelected()"
          />
        </v-col>
      </v-row>
    </v-banner>

    <PrinterGrid class="ma-2" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import CreatePrinterDialog from "@/components/Generic/Dialogs/CreatePrinterDialog.vue";
import PrinterGrid from "@/components/PrinterGrid/PrinterGrid.vue";
import { printersState } from "@/store/printers.state";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend";
import { formatBytes } from "@/utils/file-size.util";
import SideNavExplorer from "@/components/Generic/SideNavs/FileExplorerSideNav.vue";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { uploadsState } from "@/store/uploads.state";
import { convertMultiPrinterFileToQueue } from "@/utils/uploads-state.utils";
import Toolbar from "@/components/PrinterGrid/Toolbar.vue";

@Component({
  components: { PrinterGrid, SideNavExplorer, CreatePrinterDialog, Toolbar },
  data: () => ({
    selectedFile: undefined,
    viewedPrinter: undefined,
  }),
})
export default class HomePage extends Vue {
  formatBytes = formatBytes;
  $refs!: {
    fileUpload: InstanceType<typeof HTMLInputElement>;
  };
  selectedFile?: File;

  get hasPrintersSelected(): boolean {
    return this.selectedPrinters?.length > 0;
  }

  get selectedPrinters() {
    return printersState.selectedPrinters;
  }

  async uploadFile() {
    const selectedPrinters = this.selectedPrinters;
    const accessiblePrinters = selectedPrinters.filter((p) => p.apiAccessibility.accessible);

    if (!this.selectedFile) return;

    // Checking and informing user
    const incompleteListCount = selectedPrinters.length - accessiblePrinters.length;
    if (incompleteListCount > 0) {
      this.$bus.emit(
        infoMessageEvent,
        `${incompleteListCount} printers were skipped as they are not accessible or disabled (now).`
      );
    }

    const uploads = convertMultiPrinterFileToQueue(accessiblePrinters, this.selectedFile);
    uploadsState.queueUploads(uploads);

    this.$refs.fileUpload.value = "";
    this.clearSelectedPrinters();
  }

  deselectFile() {
    this.$refs.fileUpload.value = "";
    this.selectedFile = undefined;
  }

  filesSelected() {
    if (!this.$refs.fileUpload.files) return (this.selectedFile = undefined);

    this.selectedFile = this.$refs.fileUpload.files[0];
  }

  deselectPrinter(printer: Printer) {
    printersState.toggleSelectedPrinter(printer);
  }

  clearSelectedPrinters() {
    printersState.clearSelectedPrinters();
  }

  openPrinter(printer: Printer) {
    PrintersService.openPrinterURL(printer.printerURL);
  }
}
</script>
