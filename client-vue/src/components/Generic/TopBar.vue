<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">MTB3D </span>
      <span>Printer Manager</span>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <PrintJobsMenu />

  </v-app-bar>
</template>

<script>
import PrintJobsMenu from "@/components/Generic/PrintJobsMenu.vue";
export default {
  components: { PrintJobsMenu }
};
</script>
