<template>
  <v-card
    :id="this.selector"
    :class="`grid-stack-item ${this.dataItem.skeleton ? '' : 'elevation-12'}`"
    :gs-h="this.dataItem.h"
    :gs-id="this.dataItem._id"
    :gs-max-h="this.dataItem.maxH"
    :gs-max-w="this.dataItem.maxW"
    :gs-min-h="this.dataItem.minH"
    :gs-min-w="this.dataItem.minW"
    :gs-w="this.dataItem.w"
    :gs-x="this.dataItem.x"
    :gs-y="this.dataItem.y"
  >
    <v-speed-dial v-model="fab" direction="right" hidden right>
      <template v-slot:activator>
        <v-btn absolute color="secondary" dark fab right top x-small>
          <v-icon v-if="fab">close</v-icon>
          <v-icon v-else>more_vert</v-icon>
        </v-btn>
      </template>
      <v-btn color="primary" fab x-small>
        <v-icon>upload</v-icon>
      </v-btn>
      <v-btn color="indigo" fab x-small>
        <v-icon>settings</v-icon>
      </v-btn>
    </v-speed-dial>

    <v-toolbar :color="dataItem.skeleton ? 'secondary' : 'primary'" dark dense>{{
      this.getPrinterName()
    }}</v-toolbar>
    <v-card-text class="grid-stack-item-content">
      {{ dataItem.skeleton ? "not set up" : "Printing" }}
    </v-card-text>
    <v-card-actions> 0% </v-card-actions>
  </v-card>
</template>
<script>
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class GridItem extends Vue {
  @Prop() dataItem;
  @Prop() selector;
  @Prop() grid;

  skeleton = this.dataItem?.skeleton;
  fab = false;

  updated() {
    // The grid item is dereferenced on every update
    this.grid.removeWidget(`#${this.selector}`, false);
    this.grid.makeWidget(`#${this.selector}`);
  }

  getPrinterName() {
    return this.dataItem.printerName || this.dataItem.printerURL?.replace("http://", "");
  }
}
</script>

<style>
.grid-stack-item-content {
  border: 0 solid red;
  transition: border 0.6s;
}

.grid-stack-item-content:hover {
  border-color: #ffa9a9;
}
</style>
