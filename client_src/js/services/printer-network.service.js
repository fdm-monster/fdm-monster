import { ALERTS } from "../printer-manager/constants/alerts.constants";
import OctoFarmClient from "./octofarm-client.service";
import { defaultPrinter } from "../printer-manager/constants/printer.constants";
import { PrintersManagement } from "../printer-manager/printer-manager.runner";
import { NotyAlertsService } from "./alerts/noty-alerts.service";

let notyService = new NotyAlertsService();

export async function scanNetworkForDevices() {
  notyService.showInfo(ALERTS.SCANNING_NETWORK);

  const scannedPrinters = await OctoFarmClient.printerNetworkScanSsdp();
  for (const ssdpPrinter in scannedPrinters) {
    const printer = defaultPrinter();

    printer.name = ssdpPrinter.name || "";
    printer.printerURL = ssdpPrinter.url || "";

    PrintersManagement.addPrinter(printer);
  }

  notyService.showInfo(ALERTS.SCANNED_NETWORK);
}
