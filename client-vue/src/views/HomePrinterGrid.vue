<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>Location Map</v-toolbar-title>
      <v-spacer></v-spacer>
      <div>
        <v-switch
          v-model="autoPrint"
          disabled
          hide-details
          label="Auto-select and print"
        ></v-switch>
      </div>
      <v-btn class="ml-3" color="primary" type="button" @click="createPrinterModal()">
        Create Printer
      </v-btn>
    </v-toolbar>

    <v-banner v-drop-upload>
      <v-row>
        <v-col>
          <v-btn color="secondary" small @click="clearSelectedPrinters()"> Clear selection</v-btn>
          <v-chip-group>
            <v-chip v-if="selectedPrinters.length === 0">No printers selected</v-chip>
            <v-chip
              v-for="selectedPrinter in selectedPrinters"
              :key="selectedPrinter.id"
              close
              @click="openPrinter(selectedPrinter)"
              @click:close="deselectPrinter(selectedPrinter)"
            >
              {{ selectedPrinter.printerName }}
            </v-chip>
          </v-chip-group>
        </v-col>
        <v-col align="right">
          <strong class="mr-2">Drop or select GCODE to print</strong>
          <br />
          <input
            ref="fileUpload"
            :multiple="false"
            accept=".gcode"
            style="display: none"
            type="file"
            @change="filesSelected()"
          />
          <v-chip-group v-if="selectedFile" class="float-end">
            <v-chip close @click:close="deselectFile()">
              {{ selectedFile.name }}
              <strong class="pl-1">{{ formatBytes(selectedFile.size) }}</strong>
            </v-chip>
          </v-chip-group>
          <br />
          <v-btn class="ml-2" color="primary" small @click="$refs.fileUpload.click()">
            Select gcode file
          </v-btn>
          <v-btn :disabled="!selectedFile" class="ml-2" color="green" small @click="uploadFile()">
            Upload gcode file
          </v-btn>
        </v-col>
      </v-row>
    </v-banner>

    <PrinterGrid class="ma-2" />

    <CreatePrinterDialog :show.sync="showDialog" v-on:update:show="onChangeShowDialog($event)" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import CreatePrinterDialog from "@/components/Dialogs/CreatePrinterDialog.vue";
import PrinterGrid from "@/components/PrinterGrid/PrinterGrid.vue";
import { printersState } from "@/store/printers.state";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend";
import { formatBytes } from "@/utils/file-size.util";
import SideNavExplorer from "@/components/Generic/SideNavExplorer.vue";

@Component({
  components: { PrinterGrid, SideNavExplorer, CreatePrinterDialog },
  data: () => ({
    selectedFile: undefined,
    viewedPrinter: undefined
  })
})
export default class HomePage extends Vue {
  autoPrint = true;
  showDialog = false;
  formatBytes = formatBytes;
  $refs!: {
    fileUpload: InstanceType<typeof HTMLInputElement>;
  };
  selectedFile?: File;

  get selectedPrinters() {
    return printersState.selectedPrinters;
  }

  uploadFile() {
    // TODO upload file from banner
    console.log("aplood");
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

  async createPrinterModal() {
    this.showDialog = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChangeShowDialog(event: any) {
    // Placeholder
  }
}
</script>
