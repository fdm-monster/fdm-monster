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
import Vue from "vue";
import NavigationDrawer from "@/components/Generic/NavigationDrawer.vue";
import TopBar from "@/components/Generic/TopBar.vue";
import ErrorAlert from "@/components/Generic/AlertStack.vue";
import { Component, Watch } from "vue-property-decorator";
import { SSEClient } from "vue-sse";
import { PrinterSseMessage } from "@/models/sse-messages/printer-sse-message.model";
import { sseGroups, sseMessageGlobal, sseTestPrinterUpdate } from "@/event-bus/sse.events";
import { serverSettingsState } from "@/store/server-settings.state";
import { printersState } from "@/store/printers.state";
import { updatedPrinterEvent } from "@/event-bus/printer.events";
import { InfoEventType, uploadMessageEvent } from "@/event-bus/alert.events";
import UpdatePrinterDialog from "@/components/Generic/Dialogs/UpdatePrinterDialog.vue";
import FileExplorerSideNav from "@/components/Generic/SideNavs/FileExplorerSideNav.vue";
import CreatePrinterDialog from "@/components/Generic/Dialogs/CreatePrinterDialog.vue";
import { uploadsState } from "@/store/uploads.state";
import CreatePrinterGroupDialog from "@/components/Generic/Dialogs/CreatePrinterGroupDialog.vue";
import CreatePrinterFloorDialog from "@/components/Generic/Dialogs/CreatePrinterFloorDialog.vue";
import { outletCurrentValuesState } from "@/store/outlet-current.state";
import PrinterMaintenanceDialog from "@/components/Generic/Dialogs/PrinterMaintenanceDialog.vue";

@Component({
  components: {
    TopBar,
    NavigationDrawer,
    UpdatePrinterDialog,
    CreatePrinterDialog,
    CreatePrinterGroupDialog,
    CreatePrinterFloorDialog,
    PrinterMaintenanceDialog,
    FileExplorerSideNav,
    ErrorAlert
  }
})
export default class App extends Vue {
  sseClient?: SSEClient;

  get queuedUploads() {
    return uploadsState.queuedUploads;
  }

  async created() {
    uploadsState._injectEventBus(this.$bus);

    await serverSettingsState.loadServerSettings();
    await this.connectSseClient();
  }

  async connectSseClient() {
    this.sseClient = await this.$sse.create(this.$sse.$defaultConfig);
    this.sseClient.on("message", (msg) => this.onSseMessage(msg));
    this.sseClient.on("error", (err: any) =>
      console.error("Failed to parse or lost connection:", err)
    );
    this.sseClient
      .connect()
      .catch((err: any) => console.error("Failed make initial connection:", err));
  }

  @Watch("queuedUploads")
  async changeInUploads() {
    await uploadsState.handleNextUpload();
  }

  async onSseMessage(message: PrinterSseMessage) {
    if (message.printerGroups) {
      await printersState.savePrinterGroups(message.printerGroups);
      this.$bus.emit(sseGroups, message.printerGroups);
    }

    if (message.trackedUploads) {
      this.$bus.emit(uploadMessageEvent, InfoEventType.UPLOAD_BACKEND, message.trackedUploads);
    }

    if (message.floors) {
      printersState.savePrinterFloors(message.floors);
    }

    if (message.printers) {
      printersState.savePrinters(message.printers);

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
        testProgress
      });
    }

    if (message.outletCurrentValues) {
      outletCurrentValuesState.setOutletCurrentValues(message.outletCurrentValues);
    }
  }

  beforeDestroy() {
    this.sseClient?.disconnect();
  }
}
</script>

<style>
html {
  overflow-y: auto;
  background-color: #121212;
}
</style>
