<template>
  <div>
    <v-btn color="primary" type="button" @click="addNewWidget()">Add Widget</v-btn>
    {{ info }}
    <div :id="gridId" class="grid-stack d-flex">
      <GridItem
        v-for="(item, index) in items"
        :key="item.message"
        :data-item="item"
        :index="index"
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

@Component({
  components: { GridItem, Login }
})
export default class PrinterGrid extends Vue {
  gridId = "default-grid";

  grid: GridStack;
  count = 0;
  info = "";

  items: any[] = [
    {
      message: "text",
      x: 1,
      y: 2
    }
  ];

  mounted() {
    this.grid = GridStack.init({
      float: false,
      cellHeight: "100px",
      resizable: {
        handles: "se"
      }
    });

    // Use an arrow function so that `this` is bound to the Vue instance. Alternatively, use a custom Vue directive on the `.grid-stack` container element: https://vuejs.org/v2/guide/custom-directive.html
    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
      // this.info = `you just dragged node #${node.id} to ${node.x},${node.y} – good job!`;
    });
  }

  addNewWidget() {
    this.items.push({
      x: Math.round(12 * Math.random()),
      y: Math.round(5 * Math.random()),
      w: Math.round(1 + 3 * Math.random()),
      h: Math.round(1 + 3 * Math.random())
    });
    this.$forceUpdate();
    this.grid = GridStack.init({
      float: false,
      cellHeight: "100px",
      resizable: {
        handles: "se"
      }
    });
  }
}
</script>
