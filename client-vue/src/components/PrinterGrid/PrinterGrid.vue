<template>
  <div>
    <v-row no-gutters v-if="outletCurrentValues" class="ma-1">
      <v-col v-for="x in columns" :key="x" style="margin-left: 20px">
        <h3 v-if="selectedFloorLevel === 1">
          <v-icon>bolt</v-icon>
          {{ x === 1 || x === 2 ? outletCurrentValues.rack12 : outletCurrentValues.rack34 }}A / 16A
        </h3>
        <h3 v-else><v-icon>bolt</v-icon>{{ outletCurrentValues.highRack }}A / 16A</h3>
      </v-col>
    </v-row>
    <v-row v-for="y in rows" :key="y" class="ma-1" no-gutters>
      <v-col v-for="x in columns" :key="x" :cols="columnWidth" :sm="columnWidth">
        <v-row class="test-top" no-gutters>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 3)" :loading="loading" />
          </v-col>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 0)" :loading="loading" />
          </v-col>
        </v-row>
        <v-row class="test-bottom" no-gutters>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 2)" :loading="loading" />
          </v-col>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 1)" :loading="loading" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Generic/Login.vue";
import { Component } from "vue-property-decorator";
import UpdatePrinterDialog from "@/components/Generic/Dialogs/UpdatePrinterDialog.vue";
import { sseGroups, sseMessageGlobal } from "@/event-bus/sse.events";
import { printersState } from "@/store/printers.state";
import PrinterGridTile from "@/components/PrinterGrid/PrinterTile.vue";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import { columnCount, rowCount, totalVuetifyColumnCount } from "@/constants/printer-grid.constants";
import { outletCurrentValuesState } from "@/store/outlet-current.state";

@Component({
  components: { UpdatePrinterDialog, PrinterGridTile, Login },
})
export default class PrinterGrid extends Vue {
  loading = true;

  readonly maxColumnUnits = totalVuetifyColumnCount; // Built-in to vuetify
  readonly columns = columnCount; // x-value choice
  readonly rows = rowCount; // y-value choice

  columnWidth = 3; // default value overwritten later
  groupMatrix: PrinterGroup[][] = [];

  get selectedFloorLevel() {
    return printersState.selectedPrinterFloor?.floor;
  }

  get outletCurrentValues() {
    if (!outletCurrentValuesState.values) return null;
    const highRack = outletCurrentValuesState.values["11-k2-prusa-rekhoog"].value;
    const rack34 = outletCurrentValuesState.values["3-prusa-rek3laag-rek4laag"].value;
    const rack12 = outletCurrentValuesState.values["8-prusa-rek1laag-rek2laag"].value;

    console.log(rack12, rack34, highRack, this.selectedFloorLevel);
    return {
      highRack,
      rack34,
      rack12,
    };
  }

  get printers() {
    return printersState.printers;
  }

  calculateGrid() {
    this.columnWidth = this.maxColumnUnits / this.columns;
  }

  async created() {
    this.calculateGrid();
    await printersState.loadPrinters();
    await printersState.loadPrinterGroups();
    this.loading = false;

    this.updateGridMatrix();
  }

  getPrinter(col: number, row: number, index: number) {
    const x = col - 1;
    const y = this.rows - row;

    if (!this.groupMatrix?.length || !this.groupMatrix[x]) return;
    const group = this.groupMatrix[x][y];
    if (!group) return;

    const printerInGroup = this.groupMatrix[x][y].printers?.find(
      (p) => p.location === index.toString()
    );

    if (!printerInGroup) return;

    return printersState.printer(printerInGroup.printerId);
  }

  async mounted() {
    this.$bus.on(sseGroups, this.onSseMessage);
  }

  onSseMessage() {
    this.updateGridMatrix();
  }

  updateGridMatrix() {
    this.groupMatrix = printersState.gridSortedPrinterGroups(4, 4);
  }

  beforeDestroy() {
    this.$bus.off(sseMessageGlobal, this.onSseMessage);
  }
}
</script>

<style>
.test-bottom {
  border: 1px solid transparent;
  margin: 0 20px 10px 20px !important;
}

.test-top {
  border: 1px solid transparent;
  margin: 0 20px 0 20px !important;
}
</style>
