import { ServerSettings } from "@/models/server-settings/server-settings.model";
import { Action, Module, Mutation, VuexModule } from "vuex-class-modules";
import { SettingsService } from "@/backend";
import store from "@/store/index";
import { OutletCurrentValues } from "@/models/sse-messages/printer-sse-message.model";

@Module
export class OutletCurrentModule extends VuexModule {
  outletCurrentValues?: OutletCurrentValues = undefined;

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
