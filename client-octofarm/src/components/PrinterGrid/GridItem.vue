<template>
  <div
      :id="this.selector"
      :gs-h="this.dataItem.h"
      :gs-id="this.dataItem.id"
      :gs-max-h="this.dataItem.maxH"
      :gs-max-w="this.dataItem.maxW"
      :gs-min-h="this.dataItem.minH"
      :gs-min-w="this.dataItem.minW || 2"
      :gs-w="this.dataItem.w || 2"
      :gs-x="this.dataItem.x"
      :gs-y="this.dataItem.y"
      class="grid-stack-item"
  >
    <div class="grid-stack-item-content" draggable="true">
      <v-container>
        <p>{{this.dataItem.printerName}}</p>
      </v-container>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import Component from "vue-class-component";
import {Prop} from "vue-property-decorator";
import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";

@Component
export default class GridItem extends Vue {
  @Prop() dataItem;
  @Prop() selector;

  // created() {}
}
</script>

<style>
.grid-stack-item-content {
  border-radius: 10px;
  border: 2px solid darkred;
  box-shadow: -1px 1px #590B0B, -2px 2px #590B0B, -3px 3px #590B0B, -4px 4px #590B0B,
  -5px 5px #590B0B;
}
</style>
