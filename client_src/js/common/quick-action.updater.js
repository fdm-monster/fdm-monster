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
  let button = elem(withId(ACTIONS.printerEnableToggle, id));
  if (enabled) {
    button.classList.remove("btn-danger");
    button.classList.add("btn-success");
    button.title = "Press to disable your printer!";
    button.innerHTML = '<i class="fas fa-toggle-on"></i>';
  } else {
    button.classList.remove("btn-success");
    button.classList.add("btn-danger");
    button.title = "Press to enable your printer!";
    button.innerHTML = '<i class="fas fa-toggle-off"></i>';
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
