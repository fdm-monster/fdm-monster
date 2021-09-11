import { returnPrinterTableRow } from "./templates/printer-table-row.templates.js";
import { updateQuickConnectBtn } from "../common/quick-action.updater";
import { setupUpdateOctoPrintClientBtn } from "../octoprint/octoprint-client-commands";
import { setupUpdateOctoPrintPluginsBtn } from "../octoprint/octoprint-plugin-commands";
import UI from "../lib/functions/ui.js";
import PrinterManager from "../lib/modules/printerManager.js";
import PrinterLogs from "../lib/modules/printerLogs.js";
import OctoFarmClient from "../services/octofarm-client.service";
import { updatePrinterSettingsModal } from "../lib/modules/printerSettings";
import { addClick, elem, withId } from "../common/element.utils";
import { ACTIONS, CONTAINERS, LABELS } from "../common/quick-action.constants";
import { initQuickActionButtons } from "../common/quick-actions.manager";

const printerList = elem("printerList");
const ignoredHostStatesForAPIErrors = ["Setting Up", "Searching...", "Shutdown"];

function updatePrinterInfoAndState(printer) {
  const printName = elem(withId(LABELS.printerName, printer._id));
  const webButton = elem(withId(ACTIONS.printerWeb, printer._id));
  const hostBadge = elem(withId(LABELS.hostBadge, printer._id));
  const printerBadge = elem(withId(LABELS.printerBadge, printer._id));
  const socketBadge = elem(withId(LABELS.webSocketIcon, printer._id));

  const printerSortIndex = elem(withId(LABELS.printerSortIndex, printer._id));
  const printerGroup = elem(withId(LABELS.printerGroup, printer._id));

  UI.updateElem(printer.sortIndex, printerSortIndex, "innerHTML");
  UI.updateElem(printer.printerName, printName, "innerHTML");
  UI.updateElem(printer.group, printerGroup, "innerHTML");
  UI.updateElem(printer.printerURL, webButton, "href");

  printerGroup.innerHTML = printer.groups.map((g) => g.name).join() || printer.group;

  UI.updateElem(
    `tag badge badge-${printer.printerState.colour.name} badge-pill`,
    printerBadge,
    "className"
  );
  UI.updateElem(printer.printerState.state, printerBadge, "innerHTML");
  printerBadge.setAttribute("title", printer.printerState.desc);

  UI.updateElem(printer.hostState.state, hostBadge, "innerHTML");
  hostBadge.setAttribute("title", printer.hostState.desc);

  UI.updateElem(
    `tag badge badge-${printer.hostState.colour.name} badge-pill`,
    hostBadge,
    "className"
  );

  socketBadge.setAttribute("title", printer.webSocketState.desc);
  UI.updateElem(
    `tag badge badge-${printer.webSocketState.colour} badge-pill`,
    socketBadge,
    "className"
  );
}

function updatePrinterColumn(printer) {
  const printerInfo = elem(withId(LABELS.printerPrinterInformation, printer._id));
  if (!!printer.octoPrintSystemInfo) {
    if (typeof printer.octoPrintSystemInfo["printer.firmware"] === "undefined") {
      UI.updateElem(
        '<small title="Please connect and resync to display printer firmware">Unknown</small>',
        printerInfo,
        "innerHTML"
      );
    } else {
      UI.updateElem(
        `<small>${printer.octoPrintSystemInfo["printer.firmware"]}</small>`,
        printerInfo,
        "innerHTML"
      );
    }
  }
}

function updateOctoPiColumn(printer) {
  const octoPrintInfo = elem(withId(LABELS.printerOctoPrintInformation, printer._id));
  if (!!printer.octoPi) {
    UI.updateElem(
      `<small>${printer.octoPrintVersion}</small><br>` +
        (printer.octoPi?.version ? `<small>${printer.octoPi.version}</small><br>` : "") +
        `<small>${printer.octoPi.model}</small>`,
      octoPrintInfo,
      "innerHTML"
    );
  } else {
    UI.updateElem(`<small>${printer.octoPrintVersion}</small>`, octoPrintInfo, "innerHTML");
  }
}

function corsWarningCheck(printer) {
  const printerBadge = elem(withId(LABELS.printerBadge, printer._id));
  if (!printer.corsCheck && !ignoredHostStatesForAPIErrors.includes(printer.hostState.state)) {
    UI.updateElem("CORS NOT ENABLED!", printerBadge, "innerHTML");
  }
}

function checkForOctoPrintUpdate(printer) {
  let updateButton = elem(withId(ACTIONS.octoprintUpdate, printer._id));
  let bulkOctoPrintUpdateButton = elem(ACTIONS.blkUpdatePluginsBtn);
  if (printer?.octoPrintUpdate?.updateAvailable) {
    if (updateButton.disabled) {
      UI.updateElem(false, updateButton, "disabled");
      updateButton.setAttribute("title", "You have an OctoPrint Update to install!");
    }
    if (bulkOctoPrintUpdateButton.disabled) {
      bulkOctoPrintUpdateButton.disabled = false;
    }
  } else {
    if (!updateButton.disabled) {
      UI.updateElem(true, updateButton, "disabled");
      updateButton.setAttribute("title", "No OctoPrint updates available!");
    }
    if (!bulkOctoPrintUpdateButton.disabled) {
      bulkOctoPrintUpdateButton.disabled = true;
    }
  }
}

function checkForOctoPrintPluginUpdates(printer) {
  let updatePluginButton = elem(withId(ACTIONS.octoprintPluginUpdate, printer._id));
  let bulkPluginUpdateButton = elem(ACTIONS.blkUpdatePluginsBtn);
  if (printer.octoPrintPluginUpdates && printer.octoPrintPluginUpdates.length > 0) {
    if (updatePluginButton.disabled) {
      updatePluginButton.disabled = false;
      updatePluginButton.title = "You have OctoPrint plugin updates to install!";
    }
    if (bulkPluginUpdateButton.disabled) {
      bulkPluginUpdateButton.disabled = false;
    }
  } else {
    if (!updatePluginButton.disabled) {
      updatePluginButton.disabled = true;
      updatePluginButton.title = "No OctoPrint plugin updates available!";
    }
    if (!bulkPluginUpdateButton.disabled) {
      bulkPluginUpdateButton.disabled = true;
    }
  }
}

function checkForApiErrors(printer) {
  const apiErrorTag = elem(withId(LABELS.scanningIssues, printer._id));

  if (!ignoredHostStatesForAPIErrors.includes(printer.hostState.state)) {
    let apiErrors = 0;
    for (const key in printer.systemChecks) {
      if (printer.systemChecks.hasOwnProperty(key)) {
        if (printer.systemChecks[key].status !== "success") {
          apiErrors = apiErrors + 1;
        }
      }
    }
    if (apiErrors > 0) {
      if (apiErrorTag.classList.contains("d-none")) {
        apiErrorTag.classList.remove("d-none");
      }
    }
  } else {
    if (apiErrorTag.classList.contains("d-none")) {
      apiErrorTag.classList.add("d-none");
    }
  }
}

function updateButtonState(printer) {
  const printButton = elem(withId(ACTIONS.printerButton, printer._id));

  printButton.disabled = printer.printerState.colour.category === "Offline";
}

function updatePrinterRow(printer) {
  const printerCard = elem(`${CONTAINERS.printerCard}-${printer._id}`);
  if (printerCard) {
    updateButtonState(printer);

    updateQuickConnectBtn(printer);

    updatePrinterInfoAndState(printer);

    updatePrinterColumn(printer);

    updateOctoPiColumn(printer);

    corsWarningCheck(printer);

    checkForOctoPrintUpdate(printer);

    checkForOctoPrintPluginUpdates(printer);

    checkForApiErrors(printer);
  }
}

export function createOrUpdatePrinterTableRow(printers, printerControlList) {
  printers.forEach((printer) => {
    const printerCard = elem(withId(CONTAINERS.printerCard, printer._id));
    if (printerCard) {
      updatePrinterRow(printer);
    } else {
      printerList.insertAdjacentHTML("beforeend", returnPrinterTableRow(printer));
      // Insert actions buttons
      initQuickActionButtons(printer, withId(CONTAINERS.printerActionBtns, printer._id));
      // Check quick connect state and apply
      updateQuickConnectBtn(printer);
      // Initialise data
      updatePrinterRow(printer);
      // Setup listeners
      setupUpdateOctoPrintClientBtn(printer);
      setupUpdateOctoPrintPluginsBtn(printer);

      addClick(withId(ACTIONS.printerButton, printer._id), async () => {
        const printers = await OctoFarmClient.listPrinters();
        await PrinterManager.init(printer._id, printers, printerControlList);
      });
      addClick(withId(ACTIONS.printerSettings, printer._id), async (e) => {
        const printersInfo = await OctoFarmClient.listPrinters();
        await updatePrinterSettingsModal(printersInfo, printer._id);
      });
      addClick(withId(LABELS.scanningIssues, printer._id), async (e) => {
        const printersInfo = await OctoFarmClient.listPrinters();
        await updatePrinterSettingsModal(printersInfo, printer._id);
      });
      addClick(withId(ACTIONS.printerLog, printer._id), async (e) => {
        const printerInfo = await OctoFarmClient.getPrinter(printer._id);
        let connectionLogs = await OctoFarmClient.getPrinterConnectionLogs(printer._id);
        PrinterLogs.loadLogs(printerInfo, connectionLogs);
      });
      addClick(withId(ACTIONS.printerStatistics, printer._id), async (e) => {
        await PrinterLogs.loadStatistics(printer._id);
      });
    }
  });
}
