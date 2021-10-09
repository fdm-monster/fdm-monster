<template>
  <v-card
    :id="this.selector"
    :class="`grid-stack-item ${this.dataItem.skeleton ? '' : 'elevation-12'}`"
    :gs-h="this.dataItem.h"
    :gs-id="this.dataItem.id"
    :gs-max-h="this.dataItem.maxH"
    :gs-max-w="this.dataItem.maxW"
    :gs-min-h="this.dataItem.minH"
    :gs-min-w="this.dataItem.minW"
    :gs-w="this.dataItem.w"
    :gs-x="this.dataItem.x"
    :gs-y="this.dataItem.y"
    @click="clickPrinter()"
  >
    <v-toolbar :color="dataItem.skeleton ? 'secondary' : 'primary'" dark dense>
      <v-avatar color="secondary" size="54">
        {{ avatarInitials() }}
      </v-avatar>

      <v-card-text class="ml-0">
        <span class="mt-5">{{ this.getPrinterName() }}</span>
          <br />
        <small class="secondary--text font-weight-10">{{ dataItem.skeleton ? "New Printer" : "Printing" }}</small>
      </v-card-text>
    </v-toolbar>

    <v-card-subtitle class="grid-stack-item-content"></v-card-subtitle>

    <v-card-actions v-if="dataItem.skeleton">
      <v-btn> Create</v-btn>
    </v-card-actions>
    <v-card-actions v-else>
      <v-btn color="primary" fab x-small @click.stop="doSomething()">
        <v-icon>stop</v-icon>
      </v-btn>
      <v-btn color="primary" fab x-small @click.stop="doSomething()">
        <v-icon>info</v-icon>
      </v-btn>
    </v-card-actions>

    <v-speed-dial v-model="fab" direction="right" hidden left @click.native.stop>
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
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { GridStack } from "gridstack";
import { SkeletonPrinter } from "@/models/printers/crud/skeleton-printer.model";
import { generateInitials } from "@/constants/noun-adjectives.data";

export const EVENTS = {
  itemClicked: "griditem:clicked"
};
@Component
export default class GridItem extends Vue {
  @Prop() dataItem: Printer | SkeletonPrinter;
  @Prop() selector: string;
  @Prop() grid: GridStack;

  skeleton: boolean;
  fab = false;

  created() {
    this.skeleton = (this.dataItem as SkeletonPrinter)?.skeleton;
  }

  avatarInitials() {
    return generateInitials(this.dataItem.printerName);
  }

  doSomething() {
    // TODO
    console.log("Something done");
  }

  clickPrinter() {
    this.$bus.emit(EVENTS.itemClicked, this.dataItem);
  }

  updated() {
    // The grid item is dereferenced on every update
    this.grid.removeWidget(`#${this.selector}`, false);
    this.grid.makeWidget(`#${this.selector}`);
  }

  getPrinterName() {
    if ((this.dataItem as SkeletonPrinter).skeleton) return;

    let data = this.dataItem as Printer;
    return data.printerName || data.printerURL?.replace("http://", "");
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
