import { ACTIONS } from "./quick-action.constants";
import { elem, withId } from "./element.utils";

export function togglePrinterQuickConnect(id, connect = true) {
  let connectBtn = elem(withId(ACTIONS.printerQuickConnect, id));
  connectBtn.innerHTML = '<i class="fas fa-plug"></i>';
  if (connect) {
    connectBtn.classList.remove("btn-danger");
    connectBtn.classList.add("btn-success");
    connectBtn.title = "Press to disconnect your printer!";
  } else {
    connectBtn.classList.remove("btn-success");
    connectBtn.classList.add("btn-danger");
    connectBtn.title = "Press to connect your printer!";
  }
}

export function togglePrinterEnabled(id, enabled = true) {
  let connectBtn = elem(withId(ACTIONS.printerEnableToggle, id));
  if (enabled) {
    connectBtn.classList.remove("btn-danger");
    connectBtn.classList.add("btn-success");
    connectBtn.innerHTML = '<i class="fas fa-toggle-on"></i>';
  } else {
    connectBtn.classList.remove("btn-success");
    connectBtn.classList.add("btn-danger");
    connectBtn.innerHTML = '<i class="fas fa-toggle-off"></i>';
  }
}

export function updateQuickConnectBtn(printer) {
  const printerId = printer._id;
  const connOptions = printer.connectionOptions;
  const colCategory = printer.printerState.colour.category;
  const quickConnectBtn = elem(withId(ACTIONS.printerQuickConnect, printerId));

  if (
    !!connOptions &&
    (connOptions.portPreference === null ||
      connOptions.baudratePreference === null ||
      connOptions.printerProfilePreference === null)
  ) {
    quickConnectBtn.disabled = true;
  } else {
    quickConnectBtn.disabled = colCategory === "Offline";
  }

  const connectPossible =
    colCategory !== "Offline" && colCategory !== "Disconnected" && !colCategory !== "Error!";
  togglePrinterQuickConnect(printerId, connectPossible);
}
