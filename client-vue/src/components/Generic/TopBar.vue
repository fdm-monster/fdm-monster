<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">MTB</span>
      <strong>3D HUB</strong>
      <strong class="ml-14"> {{ currentTimeDiff4h || getWorkTimeDiff() }}H to 16:00</strong>
      <strong class="ml-14"> {{ currentTimeDiff5h || getWorkTimeDiff() }}H to 17:00</strong>
      <strong class="ml-14"> {{ currentTimeDiff6h || getWorkTimeDiff() }}H to 18:00</strong>
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
  currentTimeDiff4h = "";
  currentTimeDiff5h = "";
  currentTimeDiff6h = "";

  getWorkTimeDiff() {
    this.setWorkTimeDiff();

    setInterval(() => {
      this.setWorkTimeDiff();
    }, 15000);
  }

  setWorkTimeDiff() {
    this.currentTimeDiff4h = DateTime.fromObject({hour: 16}).diffNow().toFormat("hh:mm");
    this.currentTimeDiff5h = DateTime.fromObject({hour: 17}).diffNow().toFormat("hh:mm");
    this.currentTimeDiff6h = DateTime.fromObject({hour: 18}).diffNow().toFormat("hh:mm");
  }
}
</script>
