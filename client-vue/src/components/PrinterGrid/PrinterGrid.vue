<template>
  <div>
    <v-btn class="mb-3" color="primary" type="button" @click="addNewPrinter()">Add Widget</v-btn>
    <div :id="gridId" class="grid-stack d-flex">
      <GridItem
        v-for="(item, index, skeleton) in items"
        :key="index"
        :data-item="item"
        :grid="grid"
        :selector="itemPrefix + index.toString()"
        :skeleton="skeleton"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";
import { Component } from "vue-property-decorator";
import { GridItemHTMLElement, GridStack } from "gridstack";
import GridItem from "@/components/PrinterGrid/GridItem.vue";
import { Action, Getter } from "vuex-class";
import { Printer } from "@/models/printers/printer.model";
import "gridstack/dist/gridstack.min.css";
// Required for custom columns
import "gridstack/dist/gridstack-extra.min.css";
import "gridstack/dist/h5/gridstack-dd-native";

@Component({
  components: { GridItem, Login }
})
export default class PrinterGrid extends Vue {
  readonly itemPrefix = "printer-tile-";
  gridId = "default-grid";

  grid: GridStack;
  count = 0;
  info = "";

  items: any[] = [];
  newItems: any[] = [];

  @Action loadPrinters: () => Promise<Printer[]>;
  @Getter printers: Printer[];

  async mounted() {
    this.items = [];
    this.grid = GridStack.init({
      float: true,
      cellHeight: "140px",
      resizable: {
        handles: "se"
      },
      column: 6
    });

    await this.loadPrinters();

    for (let printer of this.printers) {
      this.addNewPrinter(printer);
    }

    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
    });
  }

  childMounted() {
    // Fix the hot-reload issue - doesnt fix the core issue
    if (Vue.config.devtools) {
      // location.reload();
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

  addNewPrinter(printer?: Printer | { skeleton: boolean }) {
    // We can add a placeholder in case of undef printer
    if (!printer) printer = { skeleton: true };
    this.newItems.push({ printer, index: this.items.length });
    this.items.push(printer);
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
