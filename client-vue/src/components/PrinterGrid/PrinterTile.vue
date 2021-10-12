<template>
  <v-card
    class="tile"
    :class="{ 'tile-selected': selected }"
    outlined
    tile
    @click="selectPrinter()"
  >
    <v-container v-if="printer">
      {{ printer.printerName }}
      <v-btn class="float-right" icon @click.prevent.stop="clickInfo()">
        <v-icon>info</v-icon>
      </v-btn>
      <v-btn class="float-right" icon @click.prevent.stop="clickStop()">
        <v-icon>stop</v-icon>
      </v-btn>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: {}
})
export default class PrinterGridTile extends Vue {
  @Prop() index: number;
  @Prop() printer: Printer;

  get selected() {
    return printersState.isSelectedPrinter(this.printer?.id);
  }

  get printers() {
    return printersState.printers;
  }

  id() {
    return this.printer?.printerName || this.index;
  }

  getTileClass() {
    return this.selected ? "tile tile-selected" : "tile";
  }

  clickInfo() {
    console.log("info");
  }

  clickStop() {
    console.log("stop");
  }

  selectPrinter() {
    if (!this.printer) return;

    printersState.toggleSelectedPrinter(this.printer);
  }
}
</script>

<style>
.tile {
  min-height: 80px;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
}

.tile-selected {
  border: 1px solid green !important;
}

.tile:hover {
  border: 1px solid red;
}
</style>
