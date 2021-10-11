<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>Location Map</v-toolbar-title>
      <v-spacer></v-spacer>
      <div>
        <v-switch disabled v-model="autoPrint" hide-details label="Auto-select and print"></v-switch>
      </div>
      <v-btn class="ml-3" color="primary" type="button" @click="createPrinterModal()">
        Create Printer
      </v-btn>
    </v-toolbar>

    <v-container>
      <PrinterGrid />
    </v-container>

    <CreatePrinterDialog :show.sync="showDialog" v-on:update:show="onChangeShowDialog($event)" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import CreatePrinterDialog from "@/components/Dialogs/CreatePrinterDialog.vue";
import PrinterGrid from "@/components/PrinterGrid/PrinterGrid.vue";

@Component({
  data: () => ({
  }),
  components: { PrinterGrid, CreatePrinterDialog }
})
export default class HomePage extends Vue {
  autoPrint = true;
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
