<template>
  <div>
    <v-row v-if="outletCurrentValues" class="ma-1" no-gutters>
      <v-col v-for="x in columns" :key="x" style="margin-left: 20px">
        <h3 v-if="selectedFloorLevel === 1">
          <v-icon>bolt</v-icon>
          {{ x === 1 || x === 2 ? outletCurrentValues.rack12 : outletCurrentValues.rack34 }}A / 16A
        </h3>
        <h3 v-else>
          <v-icon>bolt</v-icon>
          {{ outletCurrentValues.highRack }}A / 16A
        </h3>
      </v-col>
    </v-row>
    <v-row v-for="y in rows" :key="y" class="ma-1" no-gutters>
      <v-col v-for="x in columns" :key="x" :cols="columnWidth" :sm="columnWidth">
        <v-row class="test-top" no-gutters>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 3)" />
          </v-col>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 0)" />
          </v-col>
        </v-row>
        <v-row class="test-bottom" no-gutters>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 2)" />
          </v-col>
          <v-col cols="6">
            <PrinterGridTile :printer="getPrinter(x, y, 1)" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { sseGroups, sseMessageGlobal } from "@/event-bus/sse.events";
import PrinterGridTile from "@/components/PrinterGrid/PrinterGridTile.vue";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { columnCount, rowCount, totalVuetifyColumnCount } from "@/constants/printer-grid.constants";
import { useOutletCurrentStore } from "@/store/outlet-current.store";
import { usePrintersStore } from "@/store/printers.store";

export default defineComponent({
  components: { PrinterGridTile },
  data(): {
    columnWidth: number;
    maxColumnUnits: number;
    columns: number;
    rows: number;
    groupMatrix: PrinterGroup[][];
  } {
    return {
      columnWidth: 3,
      maxColumnUnits: totalVuetifyColumnCount,
      columns: columnCount,
      rows: rowCount,
      groupMatrix: [],
    };
  },
  setup() {
    return {
      outletCurrentStore: useOutletCurrentStore(),
      printersStore: usePrintersStore(),
    };
  },
  async created() {
    this.calculateGrid();
    await this.printersStore.loadPrinters();
    await this.printersStore.loadPrinterGroups();

    this.updateGridMatrix();
  },
  computed: {
    printers() {
      return this.printersStore.printers;
    },
    selectedFloorLevel() {
      return this.printersStore.selectedFloor?.floor;
    },
    outletCurrentValues() {
      const outletValues = this.outletCurrentStore.outletCurrentValues;
      if (!outletValues) return null;
      if (!Object.keys(outletValues).includes("11-k2-prusa-rekhoog")) return null;

      const highRack = outletValues["11-k2-prusa-rekhoog"].value;
      const rack34 = outletValues["3-prusa-rek3laag-rek4laag"].value;
      const rack12 = outletValues["8-prusa-rek1laag-rek2laag"].value;

      return {
        highRack,
        rack34,
        rack12,
      };
    },
  },
  methods: {
    calculateGrid() {
      this.columnWidth = this.maxColumnUnits / this.columns;
    },
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
      return this.printersStore.printer(printerInGroup.printerId);
    },
    updateGridMatrix() {
      this.groupMatrix = this.printersStore.gridSortedPrinterGroups(4, 4);
    },
    onSseMessage() {
      this.updateGridMatrix();
    },
  },
  async mounted() {
    this.$bus.on(sseGroups, this.onSseMessage);
  },
  beforeDestroy() {
    this.$bus.off(sseMessageGlobal, this.onSseMessage);
  },
});
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
