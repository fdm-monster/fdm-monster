<template>
  <v-toolbar flat>
    <v-toolbar-title>Printer Floors</v-toolbar-title>
    <v-btn-toggle :value="selectedFloorToggleIndex" class="ml-7" rounded @change="changeFloorIndex">
      <v-btn v-for="f in floors" :key="f._id">
        <v-icon>format_align_left</v-icon>
        {{ f.name }}
      </v-btn>
    </v-btn-toggle>
    <v-spacer></v-spacer>

    <div>
      <v-checkbox
        v-model="bedTempOverrideEnabled"
        label="Override bedtemp"
        @change="saveBedTemperatureOverride"
      ></v-checkbox>
    </div>
    <div align="center" class="ml-2">
      <v-select
        v-model="bedTemperature"
        :disabled="!bedTempOverrideEnabled"
        :items="bedTempOptions"
        hint="Select bedtemp override"
        persistent-hint
        @change="saveBedTemperature"
      ></v-select>
    </div>
  </v-toolbar>
</template>

<script lang="ts">
import Vue from "vue";
import { printersState } from "@/store/printers.state";

export default Vue.extend({
  data(): {
    selectedFloorToggleIndex: number;
    bedTempOverrideEnabled: boolean;
    bedTemperature: number;
    bedTempOptions: number[];
  } {
    return {
      selectedFloorToggleIndex: 0,
      bedTempOverrideEnabled: true,
      bedTemperature: 50,
      bedTempOptions: [50, 60],
    };
  },
  computed: {
    selectedFloorIndex() {
      if (!printersState.printerFloors || !printersState.selectedPrinterFloor) return null;

      return printersState.printerFloors.findIndex(
        (pf) => pf._id == printersState.selectedPrinterFloor!._id
      );
    },
    floors() {
      return printersState.printerFloors;
    },
  },
  methods: {
    changeFloorIndex(index: any) {
      printersState.changeSelectedFloorByIndex(index);
      this.selectedFloorToggleIndex = index;
    },
    openCreatePrinterDialog() {
      printersState.setCreateDialogOpened(true);
    },
    saveBedTemperatureOverride() {
      printersState.setBedTempOverride(this.bedTempOverrideEnabled);
    },
    saveBedTemperature() {
      printersState.setBedTemp(this.bedTemperature);
    },
  },
});
</script>
