import Vue from "vue";
import Vuex from "vuex";
import { getters, state } from "@/store/state";
import { SettingsService } from "@/backend/settings.service";
import { ServerSettings } from "@/models/server-settings.model";
import { PrintersService } from "@/backend/printers.service";
import { Printer } from "@/models/printers/printer.model";

Vue.use(Vuex);

export default new Vuex.Store({
  state,
  getters,
  mutations: {
    saveServerSettings: (state, settings: ServerSettings) => {
      state.serverSettings = settings;
    },
    savePrinters: (state, printers: Printer[]) => {
      state.printers = printers;
    }
  },
  actions: {
    async loadServerSettings({ commit }) {
      const data = await SettingsService.getServerSettings();

      commit("saveServerSettings", data);

      return data;
    },
    async loadPrinters({ commit }) {
      const data = await PrintersService.getPrinters();

      commit("savePrinters", data);

      return data;
    }
  },
  modules: {}
});
