<template>
  <v-toolbar flat>
    <v-toolbar-title>Printer Floors</v-toolbar-title>
    <v-btn-toggle
      :value="selectedFloorToggleIndex"
      class="ml-7"
      rounded
      mandatory
      @change="changeFloorIndex"
    >
      <v-btn v-for="f in floors" :key="f._id">
        <v-icon>format_align_left</v-icon>
        {{ f.name }}
      </v-btn>
    </v-btn-toggle>
    <v-spacer></v-spacer>

    <div align="center" class="mt-4 ml-2">
      <v-checkbox
        v-model="bedTempOverrideEnabled"
        label="Override BedTemp (0-100 degr)"
        @change="saveBedTemperatureOverride"
      ></v-checkbox>
    </div>
    <div align="center" class="mt-8 ml-2">
      <v-text-field
        v-model="bedTemperature"
        :disabled="!bedTempOverrideEnabled"
        min="0"
        max="100"
        @change="saveBedTemperature"
        outlined
        type="number"
      />
    </div>
  </v-toolbar>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { usePrintersStore } from "@/store/printers.store";
import { defaultBedTemp, defaultBedTempOverride } from "@/constants/app.constants";

export default defineComponent({
  name: "HomeToolbar",
  components: {},
  setup() {
    return {
      printersStore: usePrintersStore(),
    };
  },
  data(): {
    selectedFloorToggleIndex: number;
    bedTempOverrideEnabled: boolean;
    bedTemperature: number;
  } {
    return {
      selectedFloorToggleIndex: 0,
      bedTempOverrideEnabled: defaultBedTempOverride,
      bedTemperature: defaultBedTemp,
    };
  },
  computed: {
    floors() {
      return this.printersStore.printerFloors;
    },
  },
  methods: {
    changeFloorIndex(index: any) {
      this.printersStore.changeSelectedFloorByIndex(index);
      this.selectedFloorToggleIndex = index;
    },
    saveBedTemperatureOverride() {
      this.printersStore.setBedTempOverride(this.bedTempOverrideEnabled);
    },
    saveBedTemperature() {
      this.printersStore.setBedTemp(this.bedTemperature);
    },
  },
});
</script>
