import PowerButton from "./powerButton.js";
import UI from "../functions/ui";
import OctoPrintClient from "../octoprint";
import OctoFarmClient from "../../services/octofarm-client.service";
import { ACTIONS } from "../../common/quick-action.constants";
import {
  powerBtnHolder,
  printerControlBtn,
  printerEnableToggle,
  printerQuickConnect,
  printerReSyncBtn,
  printerWebBtn
} from "../../common/quick-action.elements";
import { addClick, elem, withId } from "../../common/element.utils";
import { addEnableToggleListener } from "../../common/quick-action.listeners";

function togglePrinterQuickConnect(id, connect = true) {
  let connectBtn = elem(`${ACTIONS.printerQuickConnect}-${id}`);
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

function init(printer, element) {
  elem(element).innerHTML = `
    ${printerControlBtn(printer._id)}  
    ${printerEnableToggle(printer._id)}
    ${printerQuickConnect(printer._id)} 
    ${printerReSyncBtn(printer._id)}  
    ${printerWebBtn(printer._id, printer.printerURL)}    
    ${powerBtnHolder(printer._id)}  
  `;
  PowerButton.applyBtn(printer, "powerBtn-");

  const connectPossible =
    printer.currentConnection != null &&
    printer.currentConnection.port != null &&
    printer.printerState.colour.category != "Offline";
  togglePrinterQuickConnect(printer._id, connectPossible);

  if (printer.printerState.colour.category === "Offline") {
    elem(`${ACTIONS.printerQuickConnect}-${printer._id}`).disabled = true;
  } else {
    elem(`${ACTIONS.printerQuickConnect}-${printer._id}`).disabled = false;
  }
  addEventListeners(printer);
  return true;
}

function addEventListeners(printer) {
  addEnableToggleListener(printer);

  const printerId = printer._id;

  // Quick Connect
  addClick(withId(ACTIONS.printerEnableToggle, printerId), async (e) => {
    e.disabled = true;
    if (elem(withId(ACTIONS.printerEnableToggle, printerId)).classList.contains("btn-danger")) {
      let data = {
        command: "connect",
        port: "AUTO",
        baudrate: 0,
        printerProfile: "_default"
      };
      if (typeof printer.connectionOptions !== "undefined") {
        data = {
          command: "connect",
          port: printer.connectionOptions.portPreference,
          baudrate: parseInt(printer.connectionOptions.baudratePreference),
          printerProfile: printer.connectionOptions.printerProfilePreference
        };
      } else {
        UI.createAlert(
          "warning",
          `${printer.printerName} has no preferences saved, defaulting to AUTO...`,
          8000,
          "Clicked"
        );
      }
      let post = await OctoPrintClient.postApi(printer, "connection", data);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully made connection attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue connecting to ${printer.printerName} it's either not online, or the connection options supplied are not available...`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    } else {
      bootbox.confirm({
        message: "Are you sure you want to disconnect your printer?",
        buttons: {
          confirm: {
            label: "Yes",
            className: "btn-success"
          },
          cancel: {
            label: "No",
            className: "btn-danger"
          }
        },
        callback: async function (result) {
          if (result) {
            let data = {
              command: "disconnect"
            };
            let post = await OctoPrintClient.postApi(printer, "connection", data);
            if (typeof post !== "undefined") {
              if (post.status === 204) {
                UI.createAlert(
                  "success",
                  `Successfully made disconnect attempt to ${printer.printerName}...`,
                  3000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "error",
                  `There was an issue disconnecting to ${printer.printerName} are you sure it's online?`,
                  3000,
                  "Clicked"
                );
              }
            } else {
              UI.createAlert(
                "error",
                `No response from ${printer.printerName}, is it online???`,
                3000,
                "Clicked"
              );
            }
          }
        }
      });
    }
  });

  //Re-Sync printer
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

function updateQuickConnectBtn(printer) {
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

export { init, togglePrinterQuickConnect, updateQuickConnectBtn };
