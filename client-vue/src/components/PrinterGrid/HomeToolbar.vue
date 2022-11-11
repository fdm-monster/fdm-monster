<template>
  <v-toolbar flat>
    <v-toolbar-title>Printer Floors</v-toolbar-title>
    <v-btn-toggle :value="selectedFloorToggleIndex" class="ml-7" rounded mandatory @change="changeFloorIndex">
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
import { defineComponent } from "vue";
import { usePrintersStore } from "@/store/printers.store";

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
