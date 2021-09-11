import { addClick, elem, withId } from "./element.utils";
import {
  powerBtnHolder,
  printerControlBtn,
  printerEnableToggle,
  printerQuickConnect,
  printerReSyncBtn,
  printerWebBtn
} from "./quick-action.elements";
import PowerButton from "../lib/modules/powerButton";
import { ACTIONS } from "./quick-action.constants";
import { togglePrinterEnabled, togglePrinterQuickConnect } from "./quick-action.updater";
import { addEnableToggleListener, addSyncListener } from "./quick-action.listeners";
import UI from "../lib/functions/ui";
import OctoPrintClient from "../lib/octoprint";

function addEventListeners(printer) {
  addEnableToggleListener(printer);
  addSyncListener(printer);

  const printerId = printer._id;

  addClick(withId(ACTIONS.printerQuickConnect, printerId), async (e) => {
    e.disabled = true;
    if (elem(withId(ACTIONS.printerQuickConnect, printerId)).classList.contains("btn-danger")) {
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
}

export function initQuickActionButtons(printer, element) {
  const printerId = printer._id;
  elem(element).innerHTML = `
    ${printerControlBtn(printerId)}  
    ${printerEnableToggle(printerId)}
    ${printerQuickConnect(printerId)} 
    ${printerReSyncBtn(printerId)}  
    ${printerWebBtn(printerId, printer.printerURL)}    
    ${powerBtnHolder(printerId)}`;

  PowerButton.applyBtn(printer, "powerBtn-");

  const connectPossible =
    printer.currentConnection != null &&
    printer.currentConnection.port != null &&
    printer.printerState.colour.category != "Offline";

  togglePrinterQuickConnect(printerId, connectPossible);

  togglePrinterEnabled(printerId, printer.enabled);

  if (printer.printerState.colour.category === "Offline") {
    elem(`${ACTIONS.printerQuickConnect}-${printerId}`).disabled = true;
  } else {
    elem(`${ACTIONS.printerQuickConnect}-${printerId}`).disabled = false;
  }

  addEventListeners(printer);
}
