<template>
  <div>
    <v-btn color="primary" type="button" @click="addNewWidget()">Add Widget</v-btn>
    {{ info }}
    <div :id="gridId" class="grid-stack d-flex">
      <div class="grid-stack-item">
        <div class="grid-stack-item-content">
          asd
        </div>
      </div>
      <div class="grid-stack-item" :gs-y="2">
        <div class="grid-stack-item-content">
          asd
        </div>
      </div>
      <GridItem v-for="(item, index) in items" :key="item.message" :data-item="item" :index="index"
      >
        text2
      </GridItem
      >
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
import GridItem from "@/components/PrinterGrid/GridItem.vue";

@Component({
  components: {GridItem, Login},
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

  items:any[] = [
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
    this.grid.batchUpdate();

    // this.grid.engine.nodes.forEach(function (node) {
    //   const item = items.find(function (e) {
    //     return e.id === node.id;
    //   });
    //   if (!!item) {
    //     gridStack.update(node.el, {
    //       x: item.x,
    //       y: item.y,
    //       w: item.width,
    //       h: item.height
    //     });
    //   }
    // });
    this.grid.commit();
  }

  addNewWidget() {
    this.items.push({
      x: Math.round(12 * Math.random()),
      y: Math.round(5 * Math.random()),
      w: Math.round(1 + 3 * Math.random()),
      h: Math.round(1 + 3 * Math.random())
    });
  }
}
</script>
