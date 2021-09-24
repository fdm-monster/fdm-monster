<template>
  <v-app>
    <NavigationDrawer />
    <TopBar />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import NavigationDrawer from "@/components/NavigationDrawer.vue";
import TopBar from "@/components/TopBar.vue";
import { Component } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";
import { ServerSettings } from "@/models/server-settings";

@Component({
  components: { TopBar, NavigationDrawer }
})
export default class App extends Vue {
  @Getter serverSettings: ServerSettings;
  @Action getServerSettings: () => Promise<ServerSettings>;

  async created() {
    await this.getServerSettings();
  }
}
</script>

<style>
html { overflow-y: auto }
</style>
