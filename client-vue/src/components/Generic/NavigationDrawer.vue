<template>
  <v-navigation-drawer app mini-variant class="gradient-bg" dark permanent>
    <v-list-item class="px-2">
      <v-list-item-content>
        <v-list-item-title class="text-h5">
          <div class="d-flex align-center">
            <v-img
              :src="require('@/assets/logo.png')"
              alt="FDM Monster Logo"
              class="shrink mr-2 pt-3"
              contain
              transition="scale-transition"
              width="40"
            />
          </div>
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense nav>
      <v-list-item v-for="([icon, title, path], i) in items" :key="i" :to="path" link router-link>
        <v-list-item-icon>
          <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "NavigationDrawer",
  data() {
    return {
      drawer: true,
      items: [
        ["home", "Devices", "/"],
        ["printer", "Printers", "/printers"],
        ["settings", "Settings", "/settings"],
        ["timeline", "PrintScheduling", "/scheduling"],
        ["contact_support", "About", "/about"],
      ],
    };
  },
  computed: {
    routes() {
      if (!this.$router.options.routes) return [];
      return this.$router.options.routes.filter((route) => !route.meta || !route.meta.hidden);
    },
  },
});
</script>

<style>
.gradient-bg {
  background: -moz-linear-gradient(45deg, rgba(46, 49, 146, 1), rgba(155, 5, 5, 1) 100%);
  background: -webkit-linear-gradient(45deg, rgba(46, 49, 146, 1), rgba(155, 5, 5, 1) 100%);
  background: linear-gradient(45deg, rgba(18, 18, 18, 1), rgba(155, 5, 5, 1) 100%);
  /*margin-bottom: -100px !important;*/
}
</style>
