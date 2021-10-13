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

    <v-banner v-focus>
      <strong class="mr-2">Drop one or more files to upload</strong>
      <small class="ml-2">{{ selectedPrinters.length }} printers selected</small>
      <v-btn small color="primary" class="ml-2" @click="clearSelectedPrinters()">Clear selection</v-btn>
      <v-chip-group>
        <v-chip v-if="selectedPrinters.length === 0">No printers selected</v-chip>
        <v-chip
          v-for="selectedPrinter in selectedPrinters"
          :key="selectedPrinter.id"
          close
          @click:close="deselectPrinter(selectedPrinter)"
        >
          {{ selectedPrinter.printerName }}
        </v-chip>
      </v-chip-group>
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

const watchedState = "selectedPrinterCount";

@Component({
  data: () => ({}),
  components: { PrinterGrid, CreatePrinterDialog }
})
export default class HomePage extends Vue {
  autoPrint = true;
  showDialog = false;

  get selectedPrinters() {
    return printersState.selectedPrinters;
  }

  deselectPrinter(printer: Printer) {
    printersState.toggleSelectedPrinter(printer);
  }

  clearSelectedPrinters() {
    printersState.clearSelectedPrinters();
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
