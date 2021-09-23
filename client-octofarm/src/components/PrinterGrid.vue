<template>
  <v-container>
    <button type="button" @click="addNewWidget()">Add Widget</button>
    {{ info }}
    <div :id="gridId" class="grid-stack"></div>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";
import { Component, Prop } from "vue-property-decorator";
import { GridItemHTMLElement, GridStack } from "gridstack";

@Component({
  components: { Login },
  data: () => ({
    test: true,
    grid: undefined,
    info: ""
  })
})
export default class PrinterGrid extends Vue {
  gridId = "default-grid";

  grid: GridStack;
  count = 0;
  info = "";

  items = [
    { x: 2, y: 1, h: 2},
    { x: 2, y: 4, w: 3},
    { x: 4, y: 2},
    { x: 3, y: 1, h: 2},
    { x: 0, y: 6, w: 2, h: 2}
  ];

  mounted() {
    this.grid = GridStack.init({ cellHeight: "70px", minRow: 1 });

    // Use an arrow function so that `this` is bound to the Vue instance. Alternatively, use a custom Vue directive on the `.grid-stack` container element: https://vuejs.org/v2/guide/custom-directive.html
    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
      // `this` will only access your Vue instance if you used an arrow function, otherwise `this` binds to window scope. see https://hacks.mozilla.org/2015/06/es6-in-depth-arrow-functions/
      this.info = `you just dragged node #${node.id} to ${node.x},${node.y} – good job!`;
    });
  }

  addNewWidget() {
    const node: any = this.items[this.count] || {
      x: Math.round(12 * Math.random()),
      y: Math.round(5 * Math.random()),
      w: Math.round(1 + 3 * Math.random()),
      h: Math.round(1 + 3 * Math.random())
    };
    node.id = node.content = String(this.count++);
    this.grid.addWidget(node);
  }
}
</script>
