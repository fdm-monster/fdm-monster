<template>
  <div>
    <div :id="gridId" class="grid-stack d-flex">
      <GridItem
        v-for="(printer, index) in items"
        :key="index"
        v-drop-upload="{ printer, index }"
        :grid="grid"
        :printer-id="printer.id"
        :selector="itemPrefix + index.toString()"
        :skeleton="printer.skeleton"
      />

      <UpdatePrinterDialog
        :printer-id="selectedPrinterId"
        :show.sync="showDialog"
        v-on:update:show="onChangeShowDialog($event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Generic/Login.vue";
import { Component } from "vue-property-decorator";
import { GridItemHTMLElement, GridStack } from "gridstack";
import GridStackItem, { EVENTS } from "@/components/PrinterGrid/GridStack/GridStackItem.vue";
import { Printer } from "@/models/printers/printer.model";
import "gridstack/dist/gridstack.min.css";
// Required for custom columns
import "gridstack/dist/gridstack-extra.min.css";
// Required for drag and drop
import "gridstack/dist/h5/gridstack-dd-native";
import UpdatePrinterDialog from "@/components/Dialogs/UpdatePrinterDialog.vue";
import { sseMessageGlobal } from "@/event-bus/sse.events";
import { SkeletonPrinter } from "@/models/printers/crud/skeleton-printer.model";
import { newRandomNamePair } from "@/constants/noun-adjectives.data";
import { printersState } from "@/store/printers.state";

@Component({
  components: { UpdatePrinterDialog, GridStackItem, Login }
})
export default class PrinterGrid extends Vue {
  readonly itemPrefix = "printer-tile-";
  readonly gridId = "default-grid";
  showDialog = false;
  selectedPrinterId?: string = "";

  grid: GridStack;
  count = 0;
  info = "";

  items: any[] = [];
  newItems: any[] = [];

  get printers() {
    return printersState.printers;
  }

  async mounted() {
    this.items = [];
    this.grid = GridStack.init({
      float: true,
      disableDrag: true,
      maxRow: 7,
      cellHeight: "130px",
      resizable: {
        handles: "se"
      },
      column: 6
    });

    await printersState.loadPrinters();

    for (let printer of this.printers) {
      this.addNewPrinter(printer);
    }

    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
    });

    this.$bus.on(EVENTS.itemClicked, this.openCreateDialog);
    this.$bus.on(sseMessageGlobal, this.onSseMessage);
  }

  /**
   * Required to update the grid with skeletons without gridstack breaking and without losing state
   */
  onSseMessage() {
    // Any old items are left over
    let superfluousItems: string[] = this.items.filter((i) => !i.skeleton).map((p) => p.id);

    if (!this.printers) return;

    this.printers.forEach((p) => {
      // Visual items get checked for Id equality
      const itemIndex = this.items.findIndex((item) => item.id === p.id);
      if (itemIndex === -1) {
        this.addNewPrinter(p);
      } else {
        this.items[itemIndex] = p;

        const foundItemIndex = superfluousItems.findIndex((sfI) => sfI === p.id);
        superfluousItems.splice(foundItemIndex, 1);
      }
    });

    if (superfluousItems.length > 0) {
      superfluousItems.forEach((printerId) => {
        const itemIndex = this.items.findIndex((i) => i.id === printerId);
        this.removePrinterAtIndex(itemIndex);
      });
    }
  }

  openCreateDialog(printer: Printer) {
    this.selectedPrinterId = printer.id;
    this.showDialog = true;
  }

  onChangeShowDialog(event: boolean) {
    if (!event) {
      this.selectedPrinterId = undefined;
    }
  }

  updated() {
    for (let item of this.newItems) {
      const selector = this.itemPrefix + item.index;
      if (!document.getElementById(selector)) {
        // Render failed
        console.warn(`Grid item meant for rerender not found: ${selector}`);
      } else {
        this.grid.makeWidget(`#${this.itemPrefix}${item.index}`);
      }
    }
    if (this.newItems.length !== 0) this.newItems = [];
  }

  addNewPrinter(printer?: Printer | SkeletonPrinter) {
    // We can add a placeholder in case of undef printer
    if (!printer) printer = { skeleton: true, printerName: newRandomNamePair() };

    // Let the Vue update trigger first, and then attach a logical gridstack widget
    this.newItems.push({ printer, index: this.items.length });
    this.items.push(printer);
  }

  removePrinterAtIndex(index: number) {
    this.grid.removeWidget(`#${this.itemPrefix}${index}`, true);

    this.items.splice(index, 1);

    this.$forceUpdate();
  }

  beforeDestroy() {
    this.$bus.off(sseMessageGlobal, this.onSseMessage);
    this.$bus.off(EVENTS.itemClicked, this.openCreateDialog);
    this.grid.removeAll(true);
  }
}
</script>

<style>
.grid-stack {
  display: grid;
  grid-template-columns: auto auto auto;
  padding: 10px;
}
</style>
