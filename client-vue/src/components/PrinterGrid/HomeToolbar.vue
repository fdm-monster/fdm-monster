<template>
  <v-toolbar flat>
    <v-toolbar-title>Printer Floors</v-toolbar-title>
    <v-btn-toggle
      :value="selectedFloorToggleIndex"
      class="ml-7"
      mandatory
      rounded
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
        value="bedTempOverrideEnabled"
      ></v-checkbox>
    </div>
    <div align="center" class="mt-8 ml-2">
      <v-text-field
        v-model="bedTempOverride"
        :disabled="!bedTempOverrideEnabled"
        max="100"
        min="0"
        outlined
        type="number"
      />
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
  } {
    return {
      selectedFloorToggleIndex: 0,
    };
  },
  computed: {
    bedTempOverrideEnabled: {
      get() {
        return this.printersStore.bedTempOverride;
      },
      set(value: boolean) {
        this.printersStore.setBedTempOverride(value);
      },
    },
    bedTempOverride: {
      get() {
        return this.printersStore.bedTemp;
      },
      set(value: number) {
        this.printersStore.setBedTemp(value);
      },
    },
    floors() {
      return this.printersStore.printerFloors;
    },
  },
  methods: {
    changeFloorIndex(index: any) {
      this.printersStore.changeSelectedFloorByIndex(index);
      this.selectedFloorToggleIndex = index;
    },
  },
});
</script>
