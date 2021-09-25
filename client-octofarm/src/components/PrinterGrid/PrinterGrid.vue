<template>
  <div>
    <v-btn color="primary" type="button" @click="addNewPrinter()">Add Widget</v-btn>
    <div :id="gridId" class="grid-stack d-flex">
      <GridItem
          v-for="(item, index) in items"
          :key="index"
          :data-item="item"
          :selector="'printer-tile-' + index.toString()"
          @hook:updated="childMounted"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";
import {Component} from "vue-property-decorator";
import {GridItemHTMLElement, GridStack} from "gridstack";
import GridItem from "@/components/PrinterGrid/GridItem.vue";
import {Action, Getter} from "vuex-class";
import {Printer} from "@/models/printers/printer.model";

@Component({
  components: {GridItem, Login}
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
    if (this.items.length) return;

    this.items = [];
    this.grid = GridStack.init({
      float: false,
      cellHeight: "140px",
      resizable: {
        handles: "se"
      }
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
    console.log("Mounted");
    // if (this.grid.engine.nodes.length !== this.printers.length) {
    //   console.log("grid not updated", this.grid.engine.nodes.length, this.items.length);
    //   this.items.forEach(i => this.addNewPrinter(i))
    // }
  }

  childMounted() {
    // Fix the hot-reload issue
    if (Vue.config.devtools) {
      location.reload();
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
    this.newItems = [];
  }

  addNewPrinter(printer?: Printer) {
    // We can add a placeholder in case of undef printer
    if (!printer) printer = {};
    this.newItems.push({printer, index: this.items.length});
    this.items.push(printer);
  }
}
</script>
