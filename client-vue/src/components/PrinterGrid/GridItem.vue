<template>
  <v-card
    :id="this.selector"
    :class="`grid-stack-item ${this.skeleton ? '' : 'elevation-12'}`"
    :gs-id="this.printer.id"
    :gs-h="this.printer.h"
    :gs-max-h="this.printer.maxH"
    :gs-max-w="this.printer.maxW"
    :gs-min-h="this.printer.minH"
    :gs-min-w="this.printer.minW"
    @click="clickPrinter()"
  >
    <!--    :gs-w="this.printer.w"-->
    <!--    :gs-x="this.printer.x"-->
    <!--    :gs-y="this.printer.y"-->
    <v-toolbar :color="this.skeleton ? 'secondary' : 'primary'" dark dense>
      <v-avatar color="secondary" size="54">
        {{ this.avatarInitials() }}
      </v-avatar>

      <v-card-text class="ml-0">
        <span class="mt-5 d-none d-lg-inline">{{ this.printerName() }}</span>
        <br />
        <small class="secondary--text font-weight-10">
          {{ this.skeleton ? "New Printer" : this.currentPrinterState() }}
        </small>
      </v-card-text>
    </v-toolbar>

    <v-card-subtitle class="grid-stack-item-content"></v-card-subtitle>

    <v-card-actions v-if="this.skeleton">
      <v-btn disabled>Create</v-btn>
    </v-card-actions>
    <v-card-actions v-else>
      <v-btn :color="isCancelling() ? 'warning' : 'primary'" :disabled="hasNoStoppableJob()" fab x-small @click.stop="stopClicked()">
        <v-icon>stop</v-icon>
      </v-btn>
      <v-btn color="primary" fab x-small @click.stop="infoClicked()">
        <v-icon>info</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { GridStack } from "gridstack";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { updatedPrinterEvent } from "@/event-bus/printer.events";
import { PrintersService } from "@/backend";
import { infoMessageEvent } from "@/event-bus/alert.events";

export const EVENTS = {
  itemClicked: "griditem:clicked"
};
@Component({
  data: () => ({ printer: {} })
})
export default class GridItem extends Vue {
  @Prop() printerId: string;
  @Prop() skeleton: boolean;
  @Prop() selector: string;
  @Prop() grid: GridStack;

  printer: Printer;
  initiated = false;

  created() {
    if (!this.skeleton) {
      this.printer = this.$store.getters.printer(this.printerId);
      this.$bus.on(updatedPrinterEvent(this.printerId), this.updateItem);
    }
  }

  avatarInitials() {
    if (this.skeleton) return "?";
    return generateInitials(this.printer.printerName);
  }

  currentPrinterState() {
    return this.printer.printerState.state;
  }

  isCancelling() {
    const printerState = this.printer.printerState;
    return printerState.flags.cancelling;
  }

  hasNoStoppableJob() {
    const printerState = this.printer.printerState;
    return !printerState.flags.printing && !printerState.flags.paused;
  }

  printerName() {
    if (this.skeleton) return "";

    return this.printer.printerName || this.printer.printerURL?.replace("http://", "");
  }

  updateItem(data: Printer) {
    this.printer = data;
  }

  async stopClicked() {
    if (this.isCancelling()) {
      return this.$bus.emit(infoMessageEvent, "Printer is cancelling. Please wait.");
    }
    if (this.hasNoStoppableJob()) {
      if (
        !confirm("The printer is not printing nor paused. Are you sure to send a Stop Job command?")
      ) {
        return;
      }
    }
    await PrintersService.stopPrintJob(this.printerId);
  }

  infoClicked() {
    PrintersService.openPrinterURL(this.printer.printerURL);
  }

  clickPrinter() {
    this.$bus.emit(EVENTS.itemClicked, this.printer);
  }

  updated() {
    // The grid item is not dereferenced on every update
    if (!this.initiated) {
      this.initiated = true;
      this.grid.removeWidget(`#${this.selector}`, false);
      this.grid.makeWidget(`#${this.selector}`);
    }
  }

  beforeDestroy() {
    this.$bus.off(updatedPrinterEvent(this.printerId), this.updateItem);

    // Dev mode hot-reload fix
    this.grid.removeAll(true);
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
