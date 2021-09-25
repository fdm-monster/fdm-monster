<template>
  <div>
    <v-btn color="primary" type="button" @click="addNewPrinter()">Add Widget</v-btn>
    {{ info }}
    <div :id="gridId" class="grid-stack d-flex">
      <GridItem
          v-for="(item, index) in items"
          :key="index"
          :data-item="item"
          :selector="'printer-'+index"
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

@Component({
  components: {GridItem, Login}
})
export default class PrinterGrid extends Vue {
  gridId = "default-grid";

  grid: GridStack;
  count = 0;
  info = "";

  items: any[] = [];
  newItems: any[] = [];

  @Action getPrinters;
  @Getter printers;

  async mounted() {
    this.grid = GridStack.init({
      float: false,
      cellHeight: "120px",
      resizable: {
        handles: "se"
      }
    });

    await this.getPrinters();

    for (let printer of this.printers) {
      this.addNewPrinter(printer);
    }

    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
    });
  }

  updated() {
    for (let item of this.newItems) {
      const selector = "printer-" + item.index;
      if (!document.getElementById(selector)) {
        // Render failed
        console.warn(`Grid item meant for rerender not found: ${selector}`);
      } else {
        this.grid.makeWidget("#printer-" + item.index);
      }
    }
    this.newItems = [];
  }

  addNewPrinter(printer) {
    // We add a placeholder
    if (!printer) {
      printer = {
        message: "text",
        index: this.items.length,
      };
    }

    this.items.push(printer);
    this.newItems.push({printer, index:this.items.length});
  }
}
</script>
