<template>
  <v-card
    v-drop-upload="{ printers: [printer] }"
    :class="{ 'tile-selected': selected, 'tile-setup': printer }"
    :disabled="!printer"
    :style="{ 'background-color': printerStateColor }"
    class="tile"
    outlined
    tile
    @click="selectPrinter()"
  >
    <v-container v-if="printer" class="tile-inner">
      <small class="small-resized-font ml-1">
        {{ printer.printerName }}
      </small>
      <v-btn class="float-right" icon @click.prevent.stop="clickInfo()">
        <v-icon>info</v-icon>
      </v-btn>
      <v-btn class="float-right d-none d-lg-inline" icon @click.prevent.stop="clickStop()">
        <v-icon>stop</v-icon>
      </v-btn>
      <br />
      <small class="xsmall-resized-font ml-1 text--secondary">
        {{ printer.printerState.state }}
      </small>
    </v-container>
    <v-progress-linear
      v-if="printer && printer.currentJob"
      bottom
      absolute
      :value="printer.currentJob.progress"
      color="green"
    >
    </v-progress-linear>
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
    return this.printer?.printerState.colour.hex || "rgba(0,0,0,0)";
  }

  id() {
    return this.printer?.printerName;
  }

  getTileClass() {
    return this.selected ? "tile tile-selected" : "tile";
  }

  clickInfo() {
    printersState.setSideNavPrinter(this.printer);
  }

  clickStop() {
    printersState.sendStopJobCommand(this.printer.id);
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

.tile-inner {
  opacity: 0.85;
}

.tile-selected {
  outline: 2px solid rgb(2, 248, 23) !important;
  opacity: 1;
}

.tile-setup:hover {
  outline: 2px solid #02b102 !important;
}

.small-resized-font {
  font-size: clamp(10px, 1vw, 18px);
}

.xsmall-resized-font {
  font-size: clamp(8px, 1vw, 10px);
}
</style>
