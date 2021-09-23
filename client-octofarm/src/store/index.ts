import Vue from "vue";
import Vuex from "vuex";
import { getters, state } from "@/store/state";
import { SettingsService } from "@/backend/settings.service";
import { ServerSettings } from "@/models/server-settings";

Vue.use(Vuex);

export default new Vuex.Store({
  state,
  getters,
  mutations: {
    saveServerSettings: (state, settings: ServerSettings) => {
      state.serverSettings = settings;
    }
  },
  actions: {
    async getServerSettings({ dispatch, commit }) {
      const response = await SettingsService.getServerSettings();

      commit("saveServerSettings", response);

      return response;
    }
  },
  modules: {}
});
