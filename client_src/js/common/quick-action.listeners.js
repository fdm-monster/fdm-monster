import { addClick, withId } from "./element.utils";
import { ACTIONS } from "./quick-action.constants";
import OctoFarmClient from "../services/octofarm-client.service";
import UI from "../lib/functions/ui";

/**
 * Add listener to printer row to enable or disable a printer in OctoFarm (websocket, API)
 * @param printer
 */
export function addEnableToggleListener(printer) {
  const printerId = printer._id;

  addClick(withId(ACTIONS.printerEnableToggle, printerId), async (e) => {
    e.disabled = true;

    printer.enabled = !printer.enabled;

    await OctoFarmClient.updatePrinterEnabled(printerId, printer.enabled);
  });
}

export function addSyncListener(printer) {
  const printerId = printer._id;

  addClick(withId(ACTIONS.printerSyncButton, printerId), async (e) => {
    e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>";
    e.target.disabled = true;
    let post = await OctoFarmClient.reconnectOctoPrintCommand(printer._id);
    if (post.success) {
      UI.createAlert("success", post.message, 3000, "clicked");
    } else {
      // TODO this .message property is not provided by backend
      UI.createAlert("error", post.message, 3000, "clicked");
    }

    e.target.innerHTML = "<i class='fas fa-sync'></i>";
    e.target.disabled = false;
  });
}
