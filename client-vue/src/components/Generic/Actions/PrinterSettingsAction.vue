<template>
  <v-btn class="ma-2" color="primary" fab small @click.c.capture.native.stop="openSettings()">
    <v-icon>settings</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";

export default defineComponent({
  name: "PrinterUrlAction",
  props: {
    printer: Object as PropType<Printer>,
  },
  computed: {
    printerId() {
      return this.printer!.id;
    },
  },
  methods: {
    openSettings() {
      this.$emit("update:show", this.printer!.id);
    },
  },
});
</script>
