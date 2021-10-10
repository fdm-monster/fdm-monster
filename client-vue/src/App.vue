<template>
  <v-app>
    <NavigationDrawer/>
    <TopBar/>

    <v-main>
      <ErrorAlert>
        <router-view/>
      </ErrorAlert>
    </v-main>

    <FooterList></FooterList>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import NavigationDrawer from "@/components/Generic/NavigationDrawer.vue";
import TopBar from "@/components/Generic/TopBar.vue";
import ErrorAlert from "@/components/Generic/AlertStack.vue";
import FooterList from "@/components/Generic/FooterList.vue";
import { Component } from "vue-property-decorator";
import { SSEClient } from "vue-sse";
import { PrinterSseMessage } from "@/models/sse-messages/printer-sse-message.model";
import { sseMessageGlobal, sseTestPrinterUpdate } from "@/event-bus/sse.events";
import { serverSettingsState } from "@/store/server-settings.state";
import { printersState } from "@/store/printers.state";

@Component({
  components: { TopBar, NavigationDrawer, FooterList, ErrorAlert }
})
export default class App extends Vue {
  /**
   * Listens to events - replaced with socketIO client later
   */
  sseClient?: SSEClient;

  async created() {
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

  async onSseMessage(message: PrinterSseMessage) {
    if (message.printers) {
      printersState.savePrinters(message.printers);

      // Emit the global update
      this.$bus.emit(sseMessageGlobal, message);
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
  }

  beforeDestroy() {
    this.sseClient?.disconnect();
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>
