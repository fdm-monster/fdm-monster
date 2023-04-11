<template>
  <v-btn color="secondary" @click="getFiles()">
    <v-icon>refresh</v-icon>
    <span class="d-none d-lg-inline">Refresh files</span>
  </v-btn>
</template>

<script lang="ts">
import { usePrintersStore } from "@/store/printers.store";
import { defineComponent, PropType } from "vue";
import { Printer } from "@/models/printers/printer.model";

interface Data {
  property: number;
}

export default defineComponent({
  name: "RefreshFilesAction",
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
  data: (): Data => ({
    property: 0,
  }),
  computed: {},
  methods: {
    async getFiles() {
      if (!this.printer) return;

      await this.printersStore.loadPrinterFiles({
        printerId: this.printer.id,
        recursive: false,
      });
    },
  },
  watch: {},
});
</script>
