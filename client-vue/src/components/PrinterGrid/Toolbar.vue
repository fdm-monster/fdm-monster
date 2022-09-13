<template>
  <v-toolbar flat>
    <v-toolbar-title>Location Map</v-toolbar-title>
    <v-btn-toggle class="ml-7">
      <v-btn>
        <v-icon>format_align_left</v-icon>
        Floor 1
      </v-btn>

      <v-btn>
        <v-icon>format_align_center</v-icon>
        Floor 2
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

  openCreatePrinterDialog() {
    printersState.setCreateDialogOpened(true);
  }
}
</script>
