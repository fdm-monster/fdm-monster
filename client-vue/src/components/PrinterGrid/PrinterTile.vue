<template>
  <v-card
    v-drop-upload="{ printers: [printer] }"
    :class="{ 'tile-selected': selected, 'tile-unselected': unselected, 'tile-setup': printer }"
    :disabled="!printer"
    :style="{ 'background-color': printerStateColor }"
    class="tile"
    outlined
    tile
    @click="selectPrinter()"
  >
    <v-container v-if="printer" class="tile-inner">
      <small class="small-resized-font">
        {{ printer.printerName }}
      </small>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn class="float-right d-inline d-xl-none" icon v-bind="attrs" v-on="on">
            <v-icon>more_vert</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click.prevent.stop="clickInfo()">
            <v-icon>info</v-icon>
            &nbsp;Details
          </v-list-item>
          <v-list-item @click.prevent.stop="clickOpenPrinterURL()">
            <v-icon>directions</v-icon>
            &nbsp;Visit OctoPrint
          </v-list-item>
          <v-list-item @click.prevent.stop="clickOpenSettings()">
            <v-icon>settings</v-icon>
            &nbsp;Edit Printer
          </v-list-item>
          <v-list-item @click.prevent.stop="clickEmergencyStop()">
            <v-icon>stop</v-icon>
            &nbsp;Emergency stop
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn class="float-right d-none d-xl-inline" icon @click.prevent.stop="clickInfo()">
        <v-icon>info</v-icon>
      </v-btn>
      <v-btn class="float-right d-none d-xl-inline" icon @click.prevent.stop="clickEmergencyStop()">
        <v-icon>stop</v-icon>
      </v-btn>
      <br />

      <v-tooltip
        :disabled="!printer.disabledReason"
        close-delay="100"
        color="danger"
        open-delay="0"
        top
      >
        <template v-slot:activator="{ on, attrs }">
          <small
            class="xsmall-resized-font text--secondary d-lg-inline d-none"
            v-bind="attrs"
            v-on="on"
          >
            <span v-if="printer.disabledReason">
              MAINTENANCE <v-icon class="d-none d-xl-inline" color="primary" small>info</v-icon>
            </span>
            <span v-else>{{ printer.printerState.state?.toUpperCase() }}</span>
          </small>
        </template>
        Maintenance reason: <br />
        {{ printer.disabledReason }}
      </v-tooltip>

      <v-tooltip close-delay="1000" open-delay="0" right>
        <template v-slot:activator="{ on, attrs }">
          <div
            :style="{ background: printerFilamentColorRgba }"
            class="d-flex justify-end filament-abs-border"
            v-bind="attrs"
            v-on="on"
          ></div>
        </template>
        <span>{{ printerFilamentColorName }}</span>
      </v-tooltip>
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
import { CustomGcodeService } from "@/backend/custom-gcode.service";
import { PrintersService } from "@/backend";

@Component({
  components: {},
})
export default class PrinterGridTile extends Vue {
  @Prop() printer: Printer;
  readonly defaultColor = "rgba(100,100,100,0.1)";
  readonly maintenanceColor = "black";
  readonly defaultFilamentGradient =
    "repeating-linear-gradient(-30deg, #222, #555 5px, #444 5px, #555 6px)";

  get selected() {
    if (!this.printer) return false;
    return printersState.isSelectedPrinter(this.printer?.id);
  }

  get unselected() {
    return printersState.selectedPrinters?.length && !this.selected;
  }

  get printers() {
    return printersState.printers;
  }

  get printerFilamentColorName() {
    const printerColor = this.printerFilamentColor();

    if (!printerColor) {
      return "UNKNOWN";
    }

    return `${this.printer?.lastPrintedFile.parsedColor}`;
  }

  get printerFilamentColorRgba() {
    const ralCode = this.printer?.lastPrintedFile.parsedVisualizationRAL;
    if (!ralCode) {
      return this.defaultFilamentGradient;
    }

    const ralString = ralCode.toString();
    const foundColor = Object.values(RAL_CODES).find((r) => r.code === ralString);
    if (!foundColor) {
      return this.defaultFilamentGradient;
    }

    return `${foundColor.color.hex}`;
  }

  get printerStateColor() {
    if (!this.printer) return this.defaultColor;

    if (this.printer.disabledReason?.length) return this.maintenanceColor;

    return this.printer?.printerState.colour.hex || this.defaultColor;
  }

  id() {
    return this.printer?.printerName;
  }

  clickInfo() {
    printersState.setSideNavPrinter(this.printer);
  }

  clickOpenPrinterURL() {
    PrintersService.openPrinterURL(this.printer.printerURL);
  }

  clickOpenSettings() {
    printersState.setUpdateDialogPrinter(this.printer);
  }

  async clickEmergencyStop() {
    if (confirm("Are you sure to abort the print? Please reconnect after.")) {
      await CustomGcodeService.postEmergencyM112Command(this.printer.id);
    }
  }

  selectPrinter() {
    if (!this.printer) return;

    printersState.toggleSelectedPrinter(this.printer);
  }

  private printerFilamentColor() {
    const ralCode = this.printer?.lastPrintedFile.parsedVisualizationRAL;
    if (!ralCode) {
      return undefined;
    }

    const ralString = ralCode.toString();
    return Object.values(RAL_CODES).find((r) => r.code === ralString);
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

.tile-unselected {
  opacity: 0.65;
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

.filament-abs-border {
  position: absolute;
  right: 0;
  top: 0;
  width: 14px;
  height: 100%;
  /*background: repeating-linear-gradient(-30deg, #222, #555 5px, #444 5px, #555 6px);*/
  border: 2px solid rgba(255, 250, 250, 0.5);
}
</style>
