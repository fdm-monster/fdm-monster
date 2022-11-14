import { defineStore } from "pinia";
import { VuetifyAlert } from "@/models/ui/vuetify-alert.model";

interface State {
  alerts: VuetifyAlert[];
  count: number;
}

export const useAlertsStore = defineStore("Alerts", {
  state: (): State => ({
    alerts: [],
    count: 0,
  }),
});
