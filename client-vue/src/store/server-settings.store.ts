import { defineStore } from "pinia";
import { ServerSettings } from "@/models/server-settings/server-settings.model";
import { SettingsService } from "@/backend";

interface State {
  serverSettings?: ServerSettings;
}

export const useServerSettingsStore = defineStore("ServerSettings", {
  state: (): State => ({ serverSettings: undefined }),
  actions: {
    async loadServerSettings() {
      const response = await SettingsService.getServerSettings();
      this.serverSettings = response;
      return response;
    },
  },
});
