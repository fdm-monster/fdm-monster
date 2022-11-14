<template>
  <div v-if="fileList && printerId">
    <strong>Files:</strong>
    <v-list color="primary">
      <v-list-item v-for="file in fileList.files" :key="file.path">
        {{ file.path }} - {{ file.date }}
        <v-btn @click="deleteFile(file)">
          <v-icon>delete</v-icon>
          <v-spacer></v-spacer>
          Delete
        </v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";
import { usePrintersStore } from "@/store/printers.store";

export default defineComponent({
  name: "FileControlList",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
    };
  },
  async created() {},
  async mounted() {},
  props: {
    fileList: Object as PropType<PrinterFileCache>,
    printerId: String,
  },
  computed: {},
  methods: {
    async deleteFile(file: PrinterFile) {
      if (!this.fileList || !this.printerId) return;

      // this.fileList.files =
      await this.printersStore.deletePrinterFile({
        printerId: this.printerId,
        fullPath: file.path,
      });
    },
  },
  watch: {},
});
</script>
