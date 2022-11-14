<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="text-uppercase white--text">
      <span class="font-weight-light">FDM</span>
      <strong>Monster</strong>
      <strong class="ml-4 pa-2 border-time">
        {{ currentTimeDiff4h || getWorkTimeDiff() }} 16:00</strong
      >
      <strong class="ml-4 pa-2 border-time">
        {{ currentTimeDiff5h || getWorkTimeDiff() }} 17:00</strong
      >
      <strong class="ml-4 pa-2 border-time">
        {{ currentTimeDiff6h || getWorkTimeDiff() }} 18:00</strong
      >
      <div class="d-inline-flex border-time ml-4">
        <v-text-field
          v-model="printTimeHoursMinutes"
          class="d-inline-flex pl-1"
          color="default"
          prepend-icon="watch"
          single-line
          style="margin-bottom: -12px; width: 80px"
        ></v-text-field>
        <strong class="ml-2 pt-1 pr-2 border-time">{{ finishedPrintTimeOfDay || "?" }}</strong>
      </div>
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <PrintJobsMenu />
  </v-app-bar>
</template>

<script lang="ts">
import PrintJobsMenu from "@/components/Generic/PrintJobsMenu.vue";
import { defineComponent } from "vue";
import { DateTime, Duration } from "luxon";

interface Data {
  currentTimeDiff4h: string;
  currentTimeDiff5h: string;
  currentTimeDiff6h: string;
  finishedPrintTimeOfDay?: string;
  printTimeHoursMinutes: string;
}

export default defineComponent({
  name: "TopBar",
  components: { PrintJobsMenu },
  setup: () => {
    return {};
  },
  async created() {},
  async mounted() {},
  props: {},
  data: (): Data => ({
    currentTimeDiff4h: "",
    currentTimeDiff5h: "",
    currentTimeDiff6h: "",
    finishedPrintTimeOfDay: "",
    printTimeHoursMinutes: "05:00",
  }),
  computed: {},
  methods: {
    getWorkTimeDiff() {
      this.setWorkTimeDiff();

      setInterval(() => {
        this.setWorkTimeDiff();
      }, 500);
    },
    getDiffFormat(dayHourMoment: number, simple = false) {
      const soonMoment = DateTime.fromObject({ hour: dayHourMoment }).toMillis();
      const nowTime = DateTime.now().toMillis();
      if (nowTime > soonMoment) return "PAST";

      const duration = DateTime.fromObject({ hour: dayHourMoment }).diffNow();
      if (simple) {
        return duration.toFormat("hh:mm");
      }
      return duration.toFormat("hh'h'mm'm' 'to'");
    },
    setWorkTimeDiff() {
      this.currentTimeDiff4h = this.getDiffFormat(16);
      this.currentTimeDiff5h = this.getDiffFormat(17);
      this.currentTimeDiff6h = this.getDiffFormat(18);

      try {
        const printTimeDuration = Duration.fromISOTime(this.printTimeHoursMinutes);
        const finishTime = DateTime.now().plus(printTimeDuration);
        if (!printTimeDuration) this.finishedPrintTimeOfDay = undefined;

        this.finishedPrintTimeOfDay = finishTime.toFormat("hh'H' mm'M'");
      } catch (e) {
        this.finishedPrintTimeOfDay = undefined;
      }
    },
  },
  watch: {},
});
</script>

<style lang="scss">
.border-time {
  border: 1px solid white;

  * {
    border: none;
  }
}
</style>
