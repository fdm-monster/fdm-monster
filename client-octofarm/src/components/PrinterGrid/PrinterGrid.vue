<template>
  <div>
    <v-btn color="primary" type="button" @click="addNewWidget()">Add Widget</v-btn>
    {{ info }}
    <div :id="gridId" class="grid-stack d-flex">
      <div class="grid-stack-item">
        <div class="grid-stack-item-content">
          test here
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Login.vue";
import {Component} from "vue-property-decorator";
import {GridItemHTMLElement, GridStack} from "gridstack";
import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";

@Component({
  components: {Login},
  data: () => ({
    currentTab: "Home",
    tabs: ["Home", "Posts", "Archive"]
  })
})
export default class PrinterGrid extends Vue {
  gridId = "default-grid";

  grid: GridStack;
  count = 0;
  info = "";

  items = [
    {x: 0, y: 0, h: 2},
    {x: 0, y: 0, w: 3},
    {x: 2, y: 2},
    {x: 3, y: 1, h: 2},
    {x: 4, y: 6, w: 2, h: 2}
  ];

  mounted() {
    this.grid = GridStack.init({
      float: false,
      cellHeight: "100px",
      resizable: {
        handles: "se"
      },
    });

    // Use an arrow function so that `this` is bound to the Vue instance. Alternatively, use a custom Vue directive on the `.grid-stack` container element: https://vuejs.org/v2/guide/custom-directive.html
    this.grid.on("dragstop", (event, element) => {
      if (!element) return;
      const node = (element as GridItemHTMLElement)?.gridstackNode;
      if (!node) return;
      // `this` will only access your Vue instance if you used an arrow function, otherwise `this` binds to window scope. see https://hacks.mozilla.org/2015/06/es6-in-depth-arrow-functions/
      // this.info = `you just dragged node #${node.id} to ${node.x},${node.y} – good job!`;
    });
  }

  addNewWidget() {
    const node: any = this.items[this.count] || {
      x: Math.round(12 * Math.random()),
      y: Math.round(5 * Math.random()),
      w: Math.round(1 + 3 * Math.random()),
      h: Math.round(1 + 3 * Math.random())
    };
    node.id = node.content = `${this.count++} <GridItem/>`;
    this.grid.addWidget(node);
  }
}
</script>
