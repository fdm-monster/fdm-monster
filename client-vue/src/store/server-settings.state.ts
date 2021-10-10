import { ServerSettings } from "@/models/server-settings.model";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { SettingsService } from "@/backend";
import store from "@/store/index";

@Module({
  store,
  dynamic: true,
  name: ServerSettingsModule.name
})
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

export const serverSettingsState = getModule(ServerSettingsModule, store);
