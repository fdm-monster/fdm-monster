<template>
  <v-app>
    <NavigationDrawer />
    <TopBar />

    <v-main>
      <ErrorAlert>
        <router-view />
      </ErrorAlert>
    </v-main>

    <UpdatePrinterDialog />
    <CreatePrinterDialog />
    <CreatePrinterGroupDialog />
    <CreatePrinterFloorDialog />
    <PrinterMaintenanceDialog />
    <FileExplorerSideNav />
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NavigationDrawer from "@/components/Generic/NavigationDrawer.vue";
import TopBar from "@/components/Generic/TopBar.vue";
import ErrorAlert from "@/components/Generic/AlertStack.vue";
import { SSEClient } from "vue-sse";
import { PrinterSseMessage } from "@/models/sse-messages/printer-sse-message.model";
import { sseGroups, sseMessageGlobal, sseTestPrinterUpdate } from "@/event-bus/sse.events";
import { updatedPrinterEvent } from "@/event-bus/printer.events";
import { InfoEventType, uploadMessageEvent } from "@/event-bus/alert.events";
import UpdatePrinterDialog from "@/components/Generic/Dialogs/UpdatePrinterDialog.vue";
import FileExplorerSideNav from "@/components/Generic/SideNavs/FileExplorerSideNav.vue";
import CreatePrinterDialog from "@/components/Generic/Dialogs/CreatePrinterDialog.vue";
import CreatePrinterGroupDialog from "@/components/Generic/Dialogs/CreatePrinterGroupDialog.vue";
import CreatePrinterFloorDialog from "@/components/Generic/Dialogs/CreatePrinterFloorDialog.vue";
import PrinterMaintenanceDialog from "@/components/Generic/Dialogs/PrinterMaintenanceDialog.vue";
import { useOutletCurrentStore } from "@/store/outlet-current.store";
import { useUploadsStore } from "@/store/uploads.store";
import { usePrintersStore } from "@/store/printers.store";
import { useServerSettingsStore } from "@/store/server-settings.store";

interface Data {
  sseClient?: SSEClient;
}

export default defineComponent({
  name: "AppView",
  components: {
    TopBar,
    NavigationDrawer,
    UpdatePrinterDialog,
    CreatePrinterDialog,
    CreatePrinterGroupDialog,
    CreatePrinterFloorDialog,
    PrinterMaintenanceDialog,
    FileExplorerSideNav,
    ErrorAlert,
  },
  setup: () => {
    return {
      uploadsStore: useUploadsStore(),
      printersStore: usePrintersStore(),
      outletCurrentStore: useOutletCurrentStore(),
      serverSettingsStore: useServerSettingsStore(),
    };
  },
  async created() {
    this.uploadsStore._injectEventBus(this.$bus);

    await this.serverSettingsStore.loadServerSettings();
    await this.connectSseClient();
  },
  async mounted() {},
  beforeDestroy() {
    this.sseClient?.disconnect();
  },
  props: {},
  data: (): Data => ({
    sseClient: undefined,
  }),
  computed: {
    queuedUploads() {
      return this.uploadsStore.queuedUploads;
    },
  },
  methods: {
    async connectSseClient() {
      this.sseClient = await this.$sse.create(this.$sse.$defaultConfig);
      this.sseClient.on("message", (msg) => this.onSseMessage(msg));
      this.sseClient.on("error", (err: any) =>
        console.error("Failed to parse or lost connection:", err)
      );
      this.sseClient
        .connect()
        .catch((err: any) => console.error("Failed make initial connection:", err));
    },
    async onSseMessage(message: PrinterSseMessage) {
      if (message.printerGroups) {
        this.printersStore.savePrinterGroups(message.printerGroups);
        this.$bus.emit(sseGroups, message.printerGroups);
      }

      if (message.trackedUploads) {
        this.$bus.emit(uploadMessageEvent, InfoEventType.UPLOAD_BACKEND, message.trackedUploads);
      }

      if (message.floors) {
        this.printersStore.savePrinterFloors(message.floors);
      }

      if (message.printers) {
        this.printersStore.setPrinters(message.printers);

        // Emit the global update
        this.$bus.emit(sseMessageGlobal, message);

        message.printers.forEach((p) => {
          if (!p.id) return;
          this.$bus.emit(updatedPrinterEvent(p.id), p);
        });
      }

      if (message.testPrinter) {
        // Emit a specific testing session update
        const { testPrinter, testProgress } = message;
        if (!testPrinter?.correlationToken) return;

        this.$bus.emit(sseTestPrinterUpdate(testPrinter.correlationToken), {
          testPrinter,
          testProgress,
        });
      }
      const outletStore = useOutletCurrentStore();
      if (message.outletCurrentValues) {
        outletStore.setOutletCurrentValues(message.outletCurrentValues);
      }
    },
  },
  watch: {
    async queuedUploads() {
      await this.uploadsStore.handleNextUpload();
    },
  },
});
</script>

<style>
html {
  overflow-y: auto;
  background-color: #121212;
}
</style>
