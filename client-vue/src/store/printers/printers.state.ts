import { StoreOptions } from "vuex";
import { Printer } from "@/models/printers/printer.model";
import { PrintersService } from "@/backend/printers.service";
import { StateInterface } from "@/store/state.interface";
import { ACTIONS } from "@/store/printers/printers.actions";

export interface PrintersStateInterface {
  printers: Printer[];
}

export const printersState: StoreOptions<StateInterface> = {
  state: {
    printers: []
  },
  mutations: {
    savePrinters: (state, printers: Printer[]) => {
      state.printers = printers;
    }
  },
  getters: {
    printers: (state: any) => state.printers
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
