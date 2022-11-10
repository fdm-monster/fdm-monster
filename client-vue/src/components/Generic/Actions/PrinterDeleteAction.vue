<template>
  <v-btn color="warning" outlined @click="deletePrinter()">
    <v-icon>delete</v-icon>
    <span class="d-none d-lg-inline">Delete printer</span>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";
import { usePrintersStore } from "@/store/printers.store";

export default defineComponent({
  name: "PrinterDeleteAction",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
    };
  },
  async created() {},
  async mounted() {},
  props: {
    printer: Object as PropType<Printer>,
  },
  computed: {
    printerId() {
      return this.printer!.id;
    },
  },
  methods: {
    async deletePrinter() {
      await this.printersStore.deletePrinter(this.printerId);
    },
  },
});
</script>
