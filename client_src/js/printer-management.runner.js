import { createClientSSEWorker } from "./services/client-worker.service";
import PrinterSelect from "./lib/modules/printerSelect";
import {
  bulkConnectPrinters,
  bulkDisconnectPrinters,
  bulkOctoPrintClientUpdate,
  bulkOctoPrintControlCommand,
  bulkOctoPrintGcodeCommand,
  bulkOctoPrintPluginAction,
  bulkOctoPrintPluginUpdate,
  bulkOctoPrintPowerCommand,
  bulkOctoPrintPreHeatCommand
} from "./printer-manager/actions/bulk-commands-functions";
import {
  addBlankPrinterToTable,
  bulkDeletePrinters,
  bulkEditPrinters,
  deleteAllOnAddPrinterTable,
  exportPrintersToJson,
  importPrintersFromJsonFile,
  reSyncPrinters,
  saveAllOnAddPrinterTable,
  workerEventFunction
} from "./printer-manager/actions/printer-manager.functions";
import { loadCustomGcodeScriptsModel } from "./printer-manager/actions/custom-gcode-scripts.functions";
import { setupSortablePrintersTable } from "./printer-manager/actions/sortable-table";
import { configureContainer } from "./container/container";
import { DITokens } from "./container/container.tokens";
import { addClick, elem } from "./common/element.utils";
import { ACTIONS, CONTAINERS } from "./printer-manager/printer-manager.constants";
import { scanNetworkForDevices } from "./services/printer-network.service";

const workerURL = "/printers/sse/";
const container = configureContainer();
const notyService = container.resolve(DITokens.NotyAlertsService);

const multiPrinterSelectModal = document.getElementById(CONTAINERS.multiPrintersSection);

// Bulk OctoPrint Command Listeners
addClick(ACTIONS.blkUpdatePluginsBtn, bulkOctoPrintPluginUpdate);
addClick(ACTIONS.blkOctoPrintUpdate, bulkOctoPrintClientUpdate);
addClick(ACTIONS.scanNetworkBtn, scanNetworkForDevices);
addClick(ACTIONS.customGcodeBtn, loadCustomGcodeScriptsModel);
addClick(ACTIONS.exportPrinterBtn, exportPrintersToJson);
addClick(ACTIONS.importPrinterBtn, importPrintersFromJsonFile);
addClick(ACTIONS.searchOfflineBtn, reSyncPrinters);
addClick(
  ACTIONS.bulkConnectBtn,
  PrinterSelect.create(multiPrinterSelectModal, false, "Connect Printers", bulkConnectPrinters)
);
addClick(ACTIONS.addPrinterBtn, addBlankPrinterToTable);
addClick(ACTIONS.delAllBtn, deleteAllOnAddPrinterTable);
addClick(ACTIONS.saveAllBtn, saveAllOnAddPrinterTable);

addClick(
  ACTIONS.bulkDisconnectBtn,
  PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Disconnect Printers",
    () => bulkDisconnectPrinters
  )
);
addClick(
  ACTIONS.bulkPowerBtn,
  PrinterSelect.create(
    elem("multiPrintersSection"),
    false,
    "Power On/Off Printers",
    () => bulkOctoPrintPowerCommand
  )
);
addClick(
  ACTIONS.bulkPreHeat,
  PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Pre-Heat Printers",
    () => bulkOctoPrintPreHeatCommand
  )
);
addClick(
  ACTIONS.bulkControl,
  PrinterSelect.create(
    elem(CONTAINERS.multiPrintersSection),
    false,
    "Control Printers",
    () => bulkOctoPrintControlCommand
  )
);
addClick(
  ACTIONS.bulkGcodeCommands,
  PrinterSelect.create(
    elem(CONTAINERS.multiPrintersSection),
    false,
    "Send Gcode to Printers",
    () => bulkOctoPrintGcodeCommand
  )
);
addClick(
  ACTIONS.blkPluginsInstallBtn,
  PrinterSelect.create(elem(CONTAINERS.multiPrintersSection), false, "Install Plugins", () =>
    bulkOctoPrintPluginAction("install")
  )
);
addClick(
  ACTIONS.blkPluginsUnInstallBtn,
  PrinterSelect.create(elem(CONTAINERS.multiPrintersSection), false, "Install Plugins", () =>
    bulkOctoPrintPluginAction("uninstall")
  )
);
addClick(
  ACTIONS.blkPluginsEnableBtn,
  PrinterSelect.create(elem(CONTAINERS.multiPrintersSection), false, "Enable Plugins", () =>
    bulkOctoPrintPluginAction("enable")
  )
);
addClick(
  ACTIONS.blkPluginsDisableBtn,
  PrinterSelect.create(elem(CONTAINERS.multiPrintersSection), false, "Disable Plugins", () =>
    bulkOctoPrintPluginAction("disable")
  )
);
addClick(
  ACTIONS.editPrinterBtn,
  PrinterSelect.create(
    elem(CONTAINERS.multiPrintersSection),
    true,
    "Edit Printers",
    () => bulkEditPrinters
  )
);
addClick(
  ACTIONS.deletePrintersBtn,
  PrinterSelect.create(
    elem(CONTAINERS.multiPrintersSection),
    true,
    "Printer Deletion",
    () => bulkDeletePrinters
  )
);

createClientSSEWorker(workerURL, workerEventFunction);

setupSortablePrintersTable();
