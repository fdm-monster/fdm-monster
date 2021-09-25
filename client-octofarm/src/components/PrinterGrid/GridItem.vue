<template>
  <div
    :id="this.selector"
    :gs-h="this.dataItem.h"
    :gs-id="this.dataItem._id"
    :gs-max-h="this.dataItem.maxH"
    :gs-max-w="this.dataItem.maxW"
    :gs-min-h="this.dataItem.minH"
    :gs-min-w="this.dataItem.minW || 2"
    :gs-w="this.dataItem.w"
    :gs-x="this.dataItem.x"
    :gs-y="this.dataItem.y"
    class="grid-stack-item"
  >
    <v-btn
        style="margin-top:14px; margin-right:15px"
        color="pink"
        dark
        absolute
        top
        right
        fab
    >
      <v-icon>location_on</v-icon>
    </v-btn>
    <div class="grid-stack-item-content" draggable="true">
      <v-container>
        <p>{{ this.getPrinterName() }}</p>
      </v-container>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";

@Component
export default class GridItem extends Vue {
  @Prop() dataItem;
  @Prop() selector;

  // created() {}

  getPrinterName() {
    return this.dataItem.printerName || this.dataItem.printerURL;
  }
}
</script>

<style>
.grid-stack-item-content {
  border-radius: 10px;
  border: 2px solid darkred;
  box-shadow: -1px 1px #590b0b, -2px 2px #590b0b, -3px 3px #590b0b, -4px 4px #590b0b,
  -5px 5px #590b0b;
}
</style>
