import Vue from "vue";
import Vuex from "vuex";
import { printersState } from "@/store/printers/printers.state";
import { serverSettingsState } from "@/store/server-settings/server-settings.state";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    printers: printersState,
    serverSettings: serverSettingsState
  }
});
