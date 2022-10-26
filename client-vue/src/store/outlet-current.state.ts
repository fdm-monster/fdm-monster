import { Action, Module, Mutation, VuexModule } from "vuex-class-modules";
import store from "@/store/index";
import { OutletCurrentValues } from "@/models/sse-messages/printer-sse-message.model";

@Module
export class OutletCurrentModule extends VuexModule {
  outletCurrentValues?: OutletCurrentValues = undefined;

  get values() {
    return this.outletCurrentValues;
  }

  @Mutation
  _setOutletCurrentValues(outletCurrentValues: OutletCurrentValues) {
    this.outletCurrentValues = outletCurrentValues;
  }

  @Action
  setOutletCurrentValues(outletCurrentValues: OutletCurrentValues) {
    this._setOutletCurrentValues(outletCurrentValues);
  }
}

export const outletCurrentValuesState = new OutletCurrentModule({
  store,
  name: "outlet-current-values",
});
