<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">FDM</span>
      <strong>Monster</strong>
      <strong class="ml-14"> {{ currentTimeDiff4h || getWorkTimeDiff() }} 16:00</strong>
      <strong class="ml-14"> {{ currentTimeDiff5h || getWorkTimeDiff() }} 17:00</strong>
      <strong class="ml-14"> {{ currentTimeDiff6h || getWorkTimeDiff() }} 18:00</strong>
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <PrintJobsMenu />
  </v-app-bar>
</template>

<script lang="ts">
import PrintJobsMenu from "@/components/Generic/PrintJobsMenu.vue";
import Component from "vue-class-component";
import Vue from "vue";
import { DateTime } from "luxon";

@Component({
  components: { PrintJobsMenu }
})
export default class TopBar extends Vue {
  currentTimeDiff4h = "";
  currentTimeDiff5h = "";
  currentTimeDiff6h = "";

  getWorkTimeDiff() {
    this.setWorkTimeDiff();

    setInterval(() => {
      this.setWorkTimeDiff();
    }, 15000);
  }

  getDiffFormat(dayHourMoment: number) {
    const soonMoment = DateTime.fromObject({ hour: dayHourMoment }).toMillis();
    const nowTime = DateTime.now().toMillis();
    if (nowTime > soonMoment) return "PAST";

    const duration = DateTime.fromObject({ hour: dayHourMoment }).diffNow();
    return duration.toFormat("hh'h'mm'm' 'to'");
  }

  setWorkTimeDiff() {
    this.currentTimeDiff4h = this.getDiffFormat(16);
    this.currentTimeDiff5h = this.getDiffFormat(17);
    this.currentTimeDiff6h = this.getDiffFormat(18);
  }
}
</script>
