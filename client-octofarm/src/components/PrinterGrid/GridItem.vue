<template>
  <div class="grid-stack-item" :gs-w="this.dataItem.w" :gs-x="this.dataItem.x" :gs-y="this.dataItem.y">
    <div class="grid-stack-item-content">
      <p>
        text
      </p>
    </div>
  </div>
</template>
<script>

import Vue from "vue";
import Component from "vue-class-component";
import {Prop} from "vue-property-decorator";
import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";
import {GridItemHTMLElement, GridStack} from "gridstack";

@Component
export default class GridItem extends Vue {
  @Prop() dataItem;
  @Prop() index;

  created() {
    console.log("New me", this.dataItem);
  }
}
</script>
