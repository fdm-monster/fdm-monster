import { getModule, Module, VuexModule } from "vuex-module-decorators";
import { VuetifyAlert } from "@/models/ui/vuetify-alert.model";
import store from "@/store/index";

@Module({
  name: AlertsModule.name,
  store: store
})
export class AlertsModule extends VuexModule {
  count = 0;
  alerts: VuetifyAlert[];
}

export const alertsState = getModule(AlertsModule, store);
