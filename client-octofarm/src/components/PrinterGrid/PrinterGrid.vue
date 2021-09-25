<template>
  <div>
    <v-btn color="primary" type="button" @click="addNewWidget()">Add Widget</v-btn>
    {{ info }}
    <div :id="gridId" class="grid-stack d-flex">
      <GridItem
          v-for="(item, index) in items"
          :key="index"
          :data-item="item"
          :index="index"
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
      cellHeight: "100px",
      resizable: {
        handles: "se"
      }
    });

    await this.getPrinters();

    for (let [index, printer] of this.printers.entries()) {
      this.items.push(printer);
      this.newItems.push({printer, index});
    }

    // Use an arrow function so that `this` is bound to the Vue instance. Alternatively, use a custom Vue directive on the `.grid-stack` container element: https://vuejs.org/v2/guide/custom-directive.html
    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
      // this.info = `you just dragged node #${node.id} to ${node.x},${node.y} – good job!`;
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

  addNewWidget() {
    const newItem = {
      message: "text",
      index: this.items.length
    };
    this.items.push(newItem);
    this.newItems.push(newItem);
  }
}
</script>
