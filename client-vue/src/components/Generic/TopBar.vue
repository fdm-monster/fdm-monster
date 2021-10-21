<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">3D Print Far</span>
      <strong>MTB3D</strong>
      <small class="ml-12"> {{ currentTimeDiff || getWorkTimeDiff() }} TODAY</small>
      <small class="ml-6"> {{ currentWeekendCountDown }} WEEKEND</small>
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
  currentWeekendCountDown = "";

  getWorkTimeDiff() {
    setInterval(() => {
      this.currentWeekendCountDown = DateTime.now().startOf("week").set({weekDay: 5, hour: 18}).diffNow().toFormat("dD h:mm:ss");
      this.currentTimeDiff = DateTime.fromObject({hour: 18}).diffNow().toFormat("h:mm:ss");
    }, 1000);
  }
}
</script>
