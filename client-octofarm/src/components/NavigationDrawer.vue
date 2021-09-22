<template>
  <v-navigation-drawer app class="video-background-page" :mini-variant="true" dark permanent>
    <v-list-item class="px-2">
      <v-list-item-content>
        <v-list-item-title class="text-h5">
          <div class="d-flex align-center">
            <v-img
                :src="require('@/assets/logo2.png')"
                alt="Vuetify Logo"
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

<script>
export default {
  data() {
    return {
      drawer: true,
      items: [
        ["cable", "Devices", "/"],
        ["science", "Device Commands", "/device-commands"],
        ["timeline", "Timeline", "/timeline"]
      ]
    };
  },
  computed: {
    routes() {
      const routes = this.$router.options.routes.filter(
        (route) => !route.meta || !route.meta.hidden
      );
      return routes;
    }
  }
};
</script>

<style>
/*https://mdbootstrap.com/docs/vue/css/background-image/*/
.video-background-page {
  background: -moz-linear-gradient(45deg, rgba(46, 49, 146, 1), rgba(155, 5, 5, 1) 100%);
  background: -webkit-linear-gradient(45deg, rgba(46, 49, 146, 1), rgba(155, 5, 5, 1) 100%);
  background: linear-gradient(45deg, rgba(18, 18, 18, 1), rgba(155, 5, 5, 1) 100%);
}
.video-background-page .view video {
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  height: calc(100vh - 60px);
}
</style>
