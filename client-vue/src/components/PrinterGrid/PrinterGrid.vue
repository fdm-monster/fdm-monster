<template>
  <div>
    <v-row v-for="x in 4" :key="x" class="m-0" no-gutters>
      <v-col v-for="y in 4" :key="y" :cols="columnCount" :sm="columnCount">
        <v-row class="test-top" no-gutters>
          <v-col cols="6">
            <v-card class="pa-2 tile" outlined tile> Text1 Text1</v-card>
          </v-col>
          <v-col cols="6">
            <v-card class="pa-2 tile" outlined tile> Text2 Text2</v-card>
          </v-col>
        </v-row>
        <v-row class="test-bottom" no-gutters>
          <v-col cols="6">
            <v-card class="pa-2 tile" outlined tile> Text3 Text3</v-card>
          </v-col>
          <v-col cols="6">
            <v-card class="pa-2 tile" outlined tile> Text4 Text4</v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <UpdatePrinterDialog
      :printer-id="selectedPrinterId"
      :show.sync="showDialog"
      v-on:update:show="onChangeShowDialog($event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Login from "@/components/Generic/Login.vue";
import { Component } from "vue-property-decorator";
import GridItem, { EVENTS } from "@/components/PrinterGrid/GridItem.vue";
import { Printer } from "@/models/printers/printer.model";
import UpdatePrinterDialog from "@/components/Dialogs/UpdatePrinterDialog.vue";
import { sseMessageGlobal } from "@/event-bus/sse.events";
import { printersState } from "@/store/printers.state";

@Component({
  components: { UpdatePrinterDialog, GridItem, Login }
})
export default class PrinterGrid extends Vue {
  showDialog = false;
  selectedPrinterId?: string = "";

  readonly maxColumns = 12;
  readonly galleries = 4;
  columnCount = 4;

  get printers() {
    return printersState.printers;
  }

  created() {
    this.calculateGrid();
  }

  calculateGrid() {
    this.columnCount = this.maxColumns / this.galleries;
  }

  async mounted() {
    await printersState.loadPrinters();
    //
    // for (let printer of this.printers) {
    //   this.addNewPrinter(printer);
    // }

    this.$bus.on(EVENTS.itemClicked, this.openCreateDialog);
    this.$bus.on(sseMessageGlobal, this.onSseMessage);
  }

  /**
   * Required to update the grid with skeletons without gridstack breaking and without losing state
   */
  onSseMessage() {}

  openCreateDialog(printer: Printer) {
    this.selectedPrinterId = printer.id;
    this.showDialog = true;
  }

  onChangeShowDialog(event: boolean) {
    if (!event) {
      this.selectedPrinterId = undefined;
    }
  }

  beforeDestroy() {
    this.$bus.off(sseMessageGlobal, this.onSseMessage);
    this.$bus.off(EVENTS.itemClicked, this.openCreateDialog);
  }
}
</script>

<style>
.test-bottom {
  border: 1px solid transparent;
  margin: 0 10px 10px 10px !important;
}
.test-top {
  border: 1px solid transparent;
  margin: 0 10px 0 10px !important;
}
.tile:hover {
  border: 1px solid red;
}
.tile {
  min-height: 80px;
}
</style>
