<template>
  <v-app>
    <NavigationDrawer/>
    <TopBar/>

    <v-main>
      <router-view/>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>

<script lang="ts">
// https://vuetifyjs.com/en/components/application/#default-application-markup
import Vue from "vue";
import NavigationDrawer from "@/components/NavigationDrawer.vue";
import TopBar from "@/components/TopBar.vue";

export default Vue.extend({
  components: {TopBar, NavigationDrawer},
  name: "App",

  data: () => ({
    //
  })
});
</script>
