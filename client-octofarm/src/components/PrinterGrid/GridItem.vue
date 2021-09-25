<template>
  <div
    :id="this.dataItem.id"
    :gs-h="this.dataItem.h"
    :gs-id="this.dataItem.id"
    :gs-max-h="this.dataItem.maxH"
    :gs-max-w="this.dataItem.maxW"
    :gs-min-h="this.dataItem.minH"
    :gs-min-w="this.dataItem.minW"
    :gs-w="this.dataItem.w"
    :gs-x="this.dataItem.x"
    :gs-y="this.dataItem.y"
    class="grid-stack-item"
  >
    <div class="grid-stack-item-content" draggable="true" style="border: 1px solid orange">
      <p>text</p>
    </div>
    <div class="ui-resizable-handle ui-resizable-se" style="z-index: 100; user-select: none"></div>
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
  @Prop() index;

  created() {
    return;
  }
}
</script>
