import { StoreOptions } from "vuex";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend/printers.service";
import { StateInterface } from "@/store/state.interface";
import { ACTIONS } from "@/store/printers/printers.actions";

export interface PrintersStateInterface {
  printers: Printer[];
  lastUpdated?: number;
}

export const printersState: StoreOptions<StateInterface> = {
  state: {
    printers: [],
    lastUpdated: undefined
  },
  mutations: {
    savePrinters: (state, printers: Printer[]) => {
      state.printers = printers;
      state.lastUpdated = Date.now();
    }
  },
  getters: {
    printers: (state) => state.printers,
    lastUpdated: (state) => state.lastUpdated
  },
  actions: {
    [ACTIONS.savePrinters]: ({ commit }, newPrinters) => {
      commit("savePrinters", newPrinters);

      return newPrinters;
    },
    [ACTIONS.loadPrinters]: async ({ commit }) => {
      const data = await PrintersService.getPrinters();

      commit("savePrinters", data);

      return data;
    }
  }
};
