<template>
  <v-container
    v-if="printer"
    v-drop-upload="{ printers: [printer] }"
    :style="dragging ? 'background-color:red' : ''"
    transition="scale-transition"
  >
    <v-row>
      <v-col>
        Name: {{ printer.printerName }} <br />
        URL: {{ printer.printerURL }} <br />
        Host: {{ printer.hostState?.state }} -
        <small>
          <strong>{{ printer.hostState?.desc }}</strong>
        </small>
        <br />
        WebSocket: {{ printer.webSocketState?.colour }} <br />
        Printer: {{ printer.printerState?.state }} <br />
        Files: {{ getPrinterFileCount() }} <br />
        Sort Index: {{ printer.sortIndex }} <br />
        Id: {{ printer.id }}
      </v-col>
      <v-col>
        <RefreshFilesAction :printer="printer" class="d-flex justify-end" />
        <PrinterDeleteAction :printer="printer" class="d-flex justify-end" />
      </v-col>
    </v-row>

    <FileControlList :file-list="printer.fileList" :printer-id="printerId" />
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import FileControlList from "@/components/PrinterList/FileControlList.vue";
import { Printer } from "@/models/printers/printer.model";
import PrinterDeleteAction from "@/components/Generic/Actions/PrinterDeleteAction.vue";
import RefreshFilesAction from "@/components/Generic/Actions/RefreshFilesAction.vue";
import { usePrintersStore } from "@/store/printers.store";

interface Data {
  dragging: boolean;
}

export default defineComponent({
  name: "PrinterDetails",
  components: {
    FileControlList,
    PrinterDeleteAction,
    RefreshFilesAction,
  },
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
    dragging: false,
  }),
  computed: {
    printerId() {
      return this.printer?.id;
    },
  },
  methods: {
    getPrinterFileCount() {
      if (!this.printer) return undefined;
      return this.printersStore.printerFileBucket(this.printer.id)?.files.length || 0;
    },
  },
  watch: {},
});
</script>
