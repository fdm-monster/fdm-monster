import { GetterTree } from "vuex";
import { State } from "./state.model";
import { serverSettingsState } from "@/store/server-settings/server-settings.state";

type StateGetter = GetterTree<State, any>;

export const state: State = {
  serverSettings: serverSettingsState,
  printers: []
};

export const getters: StateGetter = {
  serverSettings: (state) => state.serverSettings,
  printers: (state) => state.printers
};
