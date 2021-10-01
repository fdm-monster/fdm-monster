import { StoreOptions } from "vuex";
import { SettingsService } from "@/backend/settings.service";
import { ServerSettings } from "@/models/server-settings.model";

export interface ServerSettingsStateInterface {
  serverSettings?: ServerSettings;
}

export const serverSettingsState: StoreOptions<ServerSettingsStateInterface> = {
  state: {
    serverSettings: undefined
  },
  mutations: {
    saveServerSettings: (state, serverSettings: ServerSettings) => {
      state.serverSettings = serverSettings;
    }
  },
  getters: {
    serverSettings: (state: any) => state.serverSettings
  },
  actions: {
    async loadServerSettings({ commit }) {
      const data = await SettingsService.getServerSettings();

      commit("saveServerSettings", data);

      return data;
    }
  }
};
