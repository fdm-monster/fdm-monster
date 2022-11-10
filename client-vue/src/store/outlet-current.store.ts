import { defineStore } from "pinia";
import { OutletCurrentValues } from "@/models/sse-messages/printer-sse-message.model";

interface State {
  outletCurrentValues?: OutletCurrentValues;
}

export const useOutletCurrentStore = defineStore("OutletCurrent", {
  state: (): State => ({
    outletCurrentValues: undefined,
  }),
  getters: {
    someVal: (state) => {
      return !!state.outletCurrentValues;
    },
    someParamVal: (state) => {
      return (val: boolean) => val || !state.outletCurrentValues;
    },
    otherVal() {
      return this.someVal || this.someParamVal(1);
    },
    otherParamVal() {
      return (val2: boolean) => {
        this.someParamVal(val2);
      };
    },
  },
  actions: {
    setOutletCurrentValues(outletCurrentValues?: OutletCurrentValues) {
      this.outletCurrentValues = outletCurrentValues;
    },
  },
});
