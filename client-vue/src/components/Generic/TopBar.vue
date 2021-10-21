<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">3D Print Far</span>
      <strong>MTB3D</strong>
      <strong class="ml-12"> {{ currentTimeDiff || getWorkTimeDiff() }} to 18:00</strong>
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <PrintJobsMenu/>
  </v-app-bar>
</template>

<script>
import PrintJobsMenu from "@/components/Generic/PrintJobsMenu.vue";
import Component from "vue-class-component";
import Vue from "vue";
import { DateTime } from "luxon";

@Component({
  components: {PrintJobsMenu}
})
export default class TopBar extends Vue {
  currentTimeDiff = "";

  getWorkTimeDiff() {
    this.setWorkTimeDiff();

    setInterval(() => {
      this.setWorkTimeDiff();
    }, 15000);
  }

  setWorkTimeDiff() {
    this.currentTimeDiff = DateTime.fromObject({hour: 18}).diffNow().toFormat("hh:mm");
  }
}
</script>
