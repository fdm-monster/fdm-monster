<template>
  <v-card
    :class="{ 'tile-selected': selected, 'tile-setup': printer }"
    :disabled="!printer"
    class="tile"
    outlined
    tile
    :style="{ 'background-color': printerStateColor }"
    @click="selectPrinter()"
  >
    <v-container v-if="printer">
      <small>
        <strong style="font-size: 0.8vw">
          {{ printer.printerName }}
        </strong>
      </small>
      <v-btn class="float-right d-none d-lg-inline" icon @click.prevent.stop="clickInfo()">
        <v-icon>info</v-icon>
      </v-btn>
      <v-btn class="float-right" icon @click.prevent.stop="clickStop()">
        <v-icon>stop</v-icon>
      </v-btn>
    </v-container>
    <v-container v-else-if="!loading">
      <small class="ml-5 mt-5 text--secondary">Not set up</small>
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
  @Prop() printer: Printer;
  @Prop() loading: boolean;

  get selected() {
    if (!this.printer) return false;
    return printersState.isSelectedPrinter(this.printer?.id);
  }

  get printers() {
    return printersState.printers;
  }

  get printerStateColor() {
    return this.printer?.printerState.colour.hex || "none";
  }

  id() {
    return this.printer?.printerName;
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
  min-height: 75px;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
}

.tile-selected {
  border: 1px solid green !important;
}

.tile-setup:hover {
  border: 1px solid red;
}
</style>
