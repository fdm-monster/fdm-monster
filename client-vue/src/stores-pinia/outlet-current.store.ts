import { defineStore } from "pinia";
import { OutletCurrentValues } from "@/models/sse-messages/printer-sse-message.model";

export const useOutletCurrentStore = defineStore("OutletCurrent", {
  state: () => ({
    outletCurrentValues: undefined as OutletCurrentValues | undefined,
  }),
  actions: {
    setOutletCurrentValues(outletCurrentValues: OutletCurrentValues) {
      this.outletCurrentValues = outletCurrentValues;
    },
  },
});
