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
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: { TopBar, NavigationDrawer, FooterList },
})
export default class App extends Vue {
  @Getter serverSettings: ServerSettings;
  @Action loadServerSettings: () => Promise<ServerSettings>;
  @Action loadPrinters: () => Promise<Printer[]>;

  async created() {
    await this.loadServerSettings();
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>
