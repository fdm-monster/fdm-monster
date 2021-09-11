import { addClick } from "./element.utils";
import { ACTIONS } from "./quick-action.constants";
import OctoFarmClient from "../services/octofarm-client.service";

/**
 * Add listener to printer row to enable or disable a printer in OctoFarm (websocket, API)
 * @param printer
 */
export function addEnableToggleListener(printer) {
  addClick(`${ACTIONS.printerEnableToggle}-${printer._id}`, async (e) => {
    e.disabled = true;

    printer.enabled = !printer.enabled;

    await OctoFarmClient.updatePrinterEnabled(printer._id, printer.enabled);
  });
}
