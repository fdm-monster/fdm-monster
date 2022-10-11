import { ServerSettings } from "@/models/server-settings/server-settings.model";
import { Action, Module, Mutation, VuexModule } from "vuex-class-modules";
import { SettingsService } from "@/backend";
import store from "@/store/index";

@Module
export class ServerSettingsModule extends VuexModule {
  serverSettings?: ServerSettings = undefined;

  @Mutation
  saveServerSettings(serverSettings: ServerSettings) {
    this.serverSettings = serverSettings;
  }

  @Action
  async loadServerSettings() {
    const response = await SettingsService.getServerSettings();

    this.saveServerSettings(response);

    return response;
  }
}

export const serverSettingsState = new ServerSettingsModule({
  store,
  name: "server-settings",
});
