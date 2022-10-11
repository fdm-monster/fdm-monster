<template>
  <v-toolbar flat>
    <v-toolbar-title>Printer Floors</v-toolbar-title>
    <v-btn-toggle class="ml-7" rounded>
      <v-btn v-for="f in floors" :key="f._id">
        <v-icon>format_align_left</v-icon>
        {{ f.name }}
      </v-btn>
    </v-btn-toggle>
    <v-spacer></v-spacer>
    <div>
      <v-switch v-model="autoPrint" disabled hide-details label="Auto-select and print"></v-switch>
    </div>
    <v-btn class="ml-3" color="primary" type="button" @click="openCreatePrinterDialog()">
      Create Printer
    </v-btn>
  </v-toolbar>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";

@Component({})
export default class Toolbar extends Vue {
  autoPrint = true;

  get selectedFloor() {
    return printersState.selectedPrinterFloor?.name;
  }

  get floors() {
    return printersState.printerFloors;
  }

  openCreatePrinterDialog() {
    printersState.setCreateDialogOpened(true);
  }
}
</script>
