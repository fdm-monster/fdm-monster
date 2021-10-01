<template>
  <v-app>
    <NavigationDrawer />
    <TopBar />

    <v-main>
      <router-view />
    </v-main>

    <FooterList></FooterList>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import NavigationDrawer from "@/components/NavigationDrawer.vue";
import TopBar from "@/components/TopBar.vue";
import FooterList from "@/components/QuickActions/FooterList.vue";
import { Component } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";
import { ServerSettings } from "@/models/server-settings.model";
import { SSEClient } from "vue-sse";
import { PrinterSseMessage } from "@/models/sse-messages/printer-sse-message.model";
import { sseMessageEventGlobal } from "@/event-bus/sse.events";
import { ACTIONS } from "@/store/printers/printers.actions";

@Component({
  components: { TopBar, NavigationDrawer, FooterList }
})
export default class App extends Vue {
  @Getter serverSettings: ServerSettings;
  @Action loadServerSettings: () => Promise<ServerSettings>;

  /**
   * Listens to events - replaced with socket io client later
   */
  sseClient?: SSEClient;

  async created() {
    await this.loadServerSettings();
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
    await this.$store.dispatch(ACTIONS.savePrinters, message);
    this.$bus.emit(sseMessageEventGlobal, message);
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
