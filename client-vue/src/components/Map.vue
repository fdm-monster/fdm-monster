<template>
  <v-container>
    <v-btn class="mb-3" color="primary" type="button" @click="createPrinterModal()">
      Create Printer
    </v-btn>
    <PrinterGrid />

    <CreatePrinterDialog :show.sync="showDialog" v-on:update:show="onChangeShowDialog($event)" />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import CreatePrinterDialog from "@/components/Dialogs/CreatePrinterDialog.vue";
import { Component } from "vue-property-decorator";
import PrinterGrid from "@/components/PrinterGrid/PrinterGrid.vue";

@Component({
  components: { PrinterGrid, CreatePrinterDialog }
})
export default class Map extends Vue {
  showDialog = false;

  async createPrinterModal() {
    this.showDialog = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChangeShowDialog(event: any) {
    // Placeholder
  }
}
</script>
