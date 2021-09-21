import UI from "../../lib/functions/ui";
import OctoFarmClient from "../../services/octofarm-client.service.js";
import { createOrUpdatePrinterTableRow } from "../printer-rows";
import PowerButton from "../../lib/modules/powerButton";
import PrinterManager from "../../lib/modules/printerManager";
import { updatePrinterSettingsModal } from "../../lib/modules/printerSettings";
import Validate from "../../lib/functions/validate";
import { PrintersManagement } from "../printer-constructor";
import PrinterSelect from "../../lib/modules/printerSelect";
import FileOperations from "../../lib/functions/file";
import { createPrinterAddInstructions } from "../templates/printer-add-instructions.template";
import { NotyAlertsService } from "../../services/alerts/noty-alerts.service";
import { ALERTS } from "../constants/alerts.constants";

let powerTimer = 5000;
let notyService = new NotyAlertsService();

export function workerEventFunction(data) {
  if (!!data) {
    const modalVisibility = UI.checkIfAnyModalShown();

    if (!modalVisibility) {
      if (data.printersInformation.length > 0) {
        createOrUpdatePrinterTableRow(data.printersInformation, data.printerControlList);
      }

      if (powerTimer >= 5000) {
        data.printersInformation.forEach((printer) => {
          PowerButton.applyBtn(printer, "powerBtn-");
        });
        powerTimer = 0;
      } else {
        powerTimer += 500;
      }
    } else {
      if (UI.checkIfSpecificModalShown("printerManagerModal")) {
        PrinterManager.init("", data.printersInformation, data.printerControlList);
      }

      if (UI.checkIfSpecificModalShown("printerSettingsModal")) {
        updatePrinterSettingsModal(data.printersInformation);
      }
    }
  }
}

export async function reSyncPrinters() {
  const searchOffline = document.getElementById("searchOfflineBtn");
  const initialAlert = notyService.showSuccess(ALERTS.STARTED_BG_RESYNC);

  searchOffline.innerHTML = '<i class="fas fa-redo fa-sm fa-spin"></i> Syncing...';

  // Will throw not-implemented error
  await OctoFarmClient.reconnectFarmCommand();

  notyService.closeAlert(initialAlert);

  searchOffline.innerHTML = '<i class="fas fa-redo fa-sm"></i> Re-Sync';
}

export async function bulkEditPrinters() {
  let editedPrinters = [];
  let inputBoxes = document.querySelectorAll("*[id^=editPrinterCard-]");
  for (let i = 0; i < inputBoxes.length; i++) {
    if (inputBoxes[i]) {
      let printerID = inputBoxes[i].id;
      printerID = printerID.split("-");
      printerID = printerID[1];

      const printerURL = document.getElementById(`editInputURL-${printerID}`);
      const printerCamURL = document.getElementById(`editInputCamera-${printerID}`);
      const printerAPIKEY = document.getElementById(`editInputApikey-${printerID}`);
      const printerGroup = document.getElementById(`editInputGroup-${printerID}`);
      const printerName = document.getElementById(`editInputName-${printerID}`);
      // Check if value updated, if not fill in the old value from placeholder
      if (
        printerURL.value.length !== 0 ||
        printerCamURL.value.length !== 0 ||
        printerAPIKEY.value.length !== 0 ||
        printerGroup.value.length !== 0 ||
        printerName.value.length !== 0
      ) {
        if (printerURL.value.length === 0) {
          printerURL.value = printerURL.placeholder;
        }
        if (printerCamURL.value.length === 0) {
          printerCamURL.value = printerCamURL.placeholder;
        }
        if (printerAPIKEY.value.length === 0) {
          printerAPIKEY.value = printerAPIKEY.placeholder;
        }
        if (printerGroup.value.length === 0) {
          printerGroup.value = printerGroup.placeholder;
        }
        if (printerName.value.length === 0) {
          printerName.value = printerName.placeholder;
        }
        const printer = new PrintersManagement(
          Validate.stripHTML(printerURL.value),
          Validate.stripHTML(printerCamURL.value),
          Validate.stripHTML(printerAPIKEY.value),
          Validate.stripHTML(printerGroup.value),
          Validate.stripHTML(printerName.value)
        ).build();
        printer._id = printerID;
        editedPrinters.push(printer);
      }
    }
  }

  if (editedPrinters.length > 0) {
    try {
      const editedPrinters = await OctoFarmClient.post("/printers/update", editedPrinters);
      const printersAdded = editedPrinters.printersAdded;
      printersAdded.forEach((printer) => {
        notyService.showSuccess(ALERTS.UPDATED_PRINTERS);
      });
    } catch (e) {
      notyService.showError(ALERTS.ERROR_UPDATING_PRINTERS);
    }
  }
}

export async function bulkDeletePrinters() {
  const deletedPrinters = [];
  const selectedPrinters = PrinterSelect.getSelected();
  selectedPrinters.forEach((element) => {
    const ca = element.id.split("-");
    deletedPrinters.push(ca[1]);
  });
  await PrintersManagement.deletePrinter(deletedPrinters);
}

export async function exportPrintersToJson() {
  try {
    let printers = await OctoFarmClient.listPrinters();
    const printersExport = [];
    for (let r = 0; r < printers.length; r++) {
      const printer = {
        name: printers[r].printerName,
        group: printers[r].group,
        printerURL: printers[r].printerURL,
        camURL: printers[r].camURL,
        apiKey: printers[r].apiKey
      };
      printersExport.push(printer);
    }
    FileOperations.download("printers.json", JSON.stringify(printersExport));
  } catch (e) {
    notyService.showError(ALERTS.ERROR_EXPORTING_PRINTERS);
  }
}

export async function importPrintersFromJsonFile() {
  const Afile = this.files;
  if (Afile[0].name.includes(".json")) {
    const files = Afile[0];
    const reader = new FileReader();
    reader.onload = await PrintersManagement.importPrinters(files);
    reader.readAsText(files);
  } else {
    notyService.showError(ALERTS.ERROR_IMPORT_NOT_JSON);
  }
}

export function addBlankPrinterToTable() {
  const currentPrinterCount = document.getElementById("printerTable").rows.length;
  const newPrinterCount = document.getElementById("printerNewTable").rows.length;
  if (currentPrinterCount === 1 && newPrinterCount === 1) {
    bootbox.alert({
      message: createPrinterAddInstructions(),
      size: "large",
      scrollable: false
    });
  }
  PrintersManagement.addPrinter();
}

export function deleteAllOnAddPrinterTable() {
  let onScreenButtons = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.click();
  }
}

export async function saveAllOnAddPrinterTable() {
  const deleteAllBtn = document.getElementById("delAllBtn");
  const saveAllBtn = document.getElementById("saveAllBtn");
  saveAllBtn.disabled = true;
  deleteAllBtn.disabled = true;
  let onScreenButtons = document.querySelectorAll("*[id^=saveButton-]");
  let onScreenDelete = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.disabled = true;
  }
  for (const btn of onScreenDelete) {
    btn.disabled = true;
  }

  notyService.showWarning(ALERTS.WARNING_SAVING_PRINTERS_SLOW);

  for (const btn of onScreenButtons) {
    btn.disabled = false;
    btn.click();
    await delay(1500);
  }

  notyService.showSuccess(ALERTS.SUCCESS_SAVED_PRINTERS);

  saveAllBtn.disabled = false;
  deleteAllBtn.disabled = true;
}
