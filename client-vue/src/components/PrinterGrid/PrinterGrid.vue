<template>
  <div>
    <v-row v-for="x in columns" :key="x" class="m-0" no-gutters>
      <v-col v-for="y in rows" :key="y" :cols="columnWidth" :sm="columnWidth">
        <v-row class="test-top" no-gutters>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x - 1, y - 1, 0)" index="1" />
          </v-col>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x - 1, y - 1, 1)" index="2" />
          </v-col>
        </v-row>
        <v-row class="test-bottom" no-gutters>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x - 1, y - 1, 2)" index="3" />
          </v-col>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x - 1, y - 1, 3)" index="4" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <UpdatePrinterDialog
      :printer-id="selectedPrinterId"
      :show.sync="showDialog"
      v-on:update:show="onChangeShowDialog($event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Generic/Login.vue";
import { Component } from "vue-property-decorator";
import { EVENTS } from "@/components/PrinterGrid/GridStack/GridStackItem.vue";
import { Printer } from "@/models/printers/printer.model";
import UpdatePrinterDialog from "@/components/Dialogs/UpdatePrinterDialog.vue";
import { sseMessageGlobal } from "@/event-bus/sse.events";
import { printersState } from "@/store/printers.state";
import PrinterGridTile from "@/components/PrinterGrid/PrinterTile.vue";
import { PrinterGroup } from "@/models/printers/printer-group.model";

@Component({
  components: { UpdatePrinterDialog, PrinterGridTile, Login }
})
export default class PrinterGrid extends Vue {
  showDialog = false;
  selectedPrinterId?: string = "";

  // Translation value from 12 cols => 12/x
  columnWidth = 3;
  groupMatrix: PrinterGroup[][] = [];

  readonly maxColumnUnits = 12; // Built-in to vuetify
  readonly columns = 4; // x-value choice
  readonly rows = 4; // y-value choice

  get printers() {
    return printersState.printers;
  }

  async created() {
    this.calculateGrid();
    await printersState.loadPrinters();
    await printersState.loadPrinterGroups();

    this.groupMatrix = printersState.gridSortedPrinterGroups(4, 4);
  }

  getPrinter(x: number, y: number, index: number) {
    if (!this.groupMatrix?.length || !this.groupMatrix[x]) return;
    const group = this.groupMatrix[x][y];
    if (!group) return;

    const printerInGroup = this.groupMatrix[x][y].printers?.find((p) => p.location === index.toString());

    if (!printerInGroup) return;

    return printersState.printer(printerInGroup.printerId);
  }

  calculateGrid() {
    this.columnWidth = this.maxColumnUnits / this.columns;
  }

  async mounted() {
    await printersState.loadPrinters();

    this.$bus.on(EVENTS.itemClicked, this.openCreateDialog);
    this.$bus.on(sseMessageGlobal, this.onSseMessage);
  }

  /**
   * Required to update the grid with skeletons without gridstack breaking and without losing state
   */
  onSseMessage() {}

  openCreateDialog(printer: Printer) {
    this.selectedPrinterId = printer.id;
    this.showDialog = true;
  }

  onChangeShowDialog(event: boolean) {
    if (!event) {
      this.selectedPrinterId = undefined;
    }
  }

  beforeDestroy() {
    this.$bus.off(sseMessageGlobal, this.onSseMessage);
    this.$bus.off(EVENTS.itemClicked, this.openCreateDialog);
  }
}
</script>

<style>
.test-bottom {
  border: 1px solid transparent;
  margin: 0 10px 10px 10px !important;
}

.test-top {
  border: 1px solid transparent;
  margin: 0 10px 0 10px !important;
}
</style>
