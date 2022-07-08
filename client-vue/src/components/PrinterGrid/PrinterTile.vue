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
    <v-container
      v-if="printer"
      :style="{ 'border-right': printerFilamentColor }"
      class="tile-inner"
    >
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
      :value="printer.currentJob.progress"
      absolute
      bottom
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
import RAL_CODES from "@/constants/ral.reference.json";

@Component({
  components: {}
})
export default class PrinterGridTile extends Vue {
  @Prop() printer: Printer;
  @Prop() loading: boolean;
  readonly defaultColor = "rgba(0,0,0,0)";
  readonly defaultBorder = "0 solid black";

  get selected() {
    if (!this.printer) return false;
    return printersState.isSelectedPrinter(this.printer?.id);
  }

  get printers() {
    return printersState.printers;
  }

  get printerFilamentColor() {
    const ralCode = this.printer?.lastPrintedFile.parsedVisualizationRAL;
    if (!ralCode) {
      return this.defaultBorder;
    }

    const ralString = ralCode.toString();
    const foundColor = Object.values(RAL_CODES).find((r) => r.code === ralString);
    if (!foundColor) {
      return this.defaultBorder;
    }

    return `8px solid ${foundColor.color.hex}`;
  }

  get printerStateColor() {
    if (!this.printer) return this.defaultColor;

    return this.printer?.printerState.colour.hex || this.defaultColor;
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
  border-right-width: 8px;
}

.small-resized-font {
  font-size: clamp(10px, 1vw, 18px);
}

.xsmall-resized-font {
  font-size: clamp(8px, 1vw, 10px);
}
</style>
