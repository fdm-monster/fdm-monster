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
import { elem } from "../../common/element.utils";
import { addEnableToggleListener } from "../../common/quick-action.listeners";

function printerQuickConnected(id) {
  let connectBtn = elem(`${ACTIONS.printerQuickConnect}-${id}`);
  connectBtn.innerHTML = '<i class="fas fa-plug"></i>';
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-success");
  connectBtn.title = "Press to connect your printer!";
}

function printerQuickDisconnected(id) {
  let connectBtn = elem(`${ACTIONS.printerQuickConnect}-${id}`);
  connectBtn.innerHTML = '<i class="fas fa-plug"></i>';
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-danger");
  connectBtn.title = "Press to connect your printer!";
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
  if (
    printer.currentConnection != null &&
    printer.currentConnection.port != null &&
    printer.printerState.colour.category != "Offline"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
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

  // Quick Connect
  elem(`${ACTIONS.printerEnableToggle}-${printer._id}`).addEventListener("click", async (e) => {
    e.disabled = true;
    if (elem(`${ACTIONS.printerEnableToggle}-${printer._id}`).classList.contains("btn-danger")) {
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
  elem(`${ACTIONS.printerSyncButton}-${printer._id}`).addEventListener("click", async (e) => {
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

function checkQuickConnectState(printer) {
  const quickConnectBtn = elem(`${ACTIONS.printerQuickConnect}-${printer._id}`);
  quickConnectBtn.disabled = printer.printerState.colour.category === "Offline";
  if (!!printer.connectionOptions) {
    if (
      printer.connectionOptions.portPreference === null ||
      printer.connectionOptions.baudratePreference === null ||
      printer.connectionOptions.printerProfilePreference === null
    ) {
      quickConnectBtn.disabled = true;
    }
  } else {
    quickConnectBtn.disabled = true;
  }

  const colCategory = printer.printerState.colour.category;
  if ((colCategory !== "Offline" && colCategory === "Disconnected") || colCategory === "Error!") {
    printerQuickDisconnected(printer._id);
  } else if (
    colCategory !== "Offline" &&
    colCategory !== "Disconnected" &&
    !colCategory !== "Error!"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
}

export { init, printerQuickConnected, printerQuickDisconnected, checkQuickConnectState };
