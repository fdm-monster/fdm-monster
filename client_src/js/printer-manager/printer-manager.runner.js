import Validate from "../lib/functions/validate";
import UI from "../lib/functions/ui";
import OctoFarmClient from "../services/octofarm-client.service.js";
import { ApplicationError } from "../exceptions/application-error.handler";
import { defaultPrinter } from "./constants/printer.constants";
import { addClick, elem, withId } from "../common/element.utils";
import { ACTIONS, CONTAINERS } from "./printer-manager.constants";
import { litTo, unlitTo } from "../utils/lit.utils";
import { NewPrinterTableElement } from "./templates/new-printer-table.element";

let newPrintersIndex = 0;

export class PrintersManagement {
  constructor(printerURL, camURL, apiKey, group, name) {
    this.printer = {
      printerURL,
      camURL,
      apiKey,
      group,
      name,
      settingsAppearance: {
        color: "default",
        colorTransparent: false,
        defaultLanguage: "_default",
        name,
        showFahrenheitAlso: false
      }
    };
  }

  static addPrinter(printer) {
    // const newPrinterTable = elem(CONTAINERS.printerNewTable);
    const newPrinterList = elem(CONTAINERS.newPrinterList);
    const showExample = !!printer;
    let currentIndex = newPrintersIndex;

    // if (newPrinterTable.classList.contains("d-none")) {
    //   newPrinterTable.classList.remove("d-none");
    // }

    // Loses this context
    litTo(new NewPrinterTableElement().render(), newPrinterList);
    const newPrinterCard = elem(withId(CONTAINERS.newPrinterCard, currentIndex));

    if (!newPrinterCard) {
      return console.error("Could not load 'newPrinterCard' ", currentIndex);
    }
    // addClick(withId(ACTIONS.saveButton, currentIndex), async (event) => {
    //   await PrintersManagement.savePrinter(event.target);
    // });
    addClick(withId(ACTIONS.delButton, currentIndex), (_) => {
      unlitTo(newPrinterList);

      // if (newPrinterTable.rows.length === 1) {
      //   if (!newPrinterTable.classList.contains("d-none")) {
      //     newPrinterTable.classList.add("d-none");
      //   }
      // }
    });

    newPrintersIndex++;
  }

  static async importPrinters() {
    return function (e) {
      const byteData = e.target.result;
      if (Validate.JSON(byteData)) {
        const importedPrinters = JSON.parse(byteData);
        for (let importedPrinter of importedPrinters) {
          const printer = defaultPrinter();
          printer.name = importedPrinter.name || "";
          printer.printerURL = importedPrinter.printerURL || "";
          printer.camURL = importedPrinter.camURL || "";
          printer.group = importedPrinter.group || "";
          printer.apiKey = importedPrinter.apiKey || "";

          PrintersManagement.addPrinter(printer);
        }

        UI.createAlert(
          "success",
          "Successfully imported your printer list, Please check it over and save when ready.",
          3000
        );
      } else {
        UI.createAlert(
          "error",
          "The file you have tried to upload contains json syntax errors.",
          3000
        );
      }
    };
  }

  static async deletePrinter(deletedPrinters) {
    if (deletedPrinters.length > 1) {
      throw new ApplicationError("Deleting more than one printer is currently not implemented.");
    }

    if (deletedPrinters.length > 0) {
      try {
        const response = await OctoFarmClient.deletePrinter(deletedPrinters[0]);

        const entity = response.printerRemoved;

        UI.createAlert(
          "success",
          `Printer: ${entity.printerURL} has successfully been removed from the farm...`,
          1000,
          "Clicked"
        );
        document.getElementById(`printerCard-${entity._id}`).remove();
      } catch (e) {
        console.error(e);
        UI.createAlert(
          "error",
          "Something went wrong updating the server, please check your logs",
          3000,
          "clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        "To delete a printer... one must first select a printer.",
        3000,
        "Clicked"
      );
    }
  }

  static async savePrinter(event) {
    try {
      let newId = event.id.split("-");
      newId = newId[1];

      // Grab new printer cells...
      const printerURL = document.getElementById(`newPrinterURL-${newId}`);
      const printerCamURL = document.getElementById(`newPrinterCamURL-${newId}`);
      const printerAPIKEY = document.getElementById(`newPrinterAPIKEY-${newId}`);
      const printerGroup = document.getElementById(`newPrinterGroup-${newId}`);
      const printerName = document.getElementById(`newPrinterName-${newId}`);

      const errors = [];
      let printCheck = -1;
      if (printerURL.value !== "") {
        const printerInfo = await OctoFarmClient.listPrinters();
        printCheck = _.findIndex(printerInfo, function (o) {
          return JSON.stringify(o.printerURL) === JSON.stringify(printerURL.value);
        });
      }
      // Check information is filled correctly...
      if (
        printerURL.value === "" ||
        printCheck > -1 ||
        printerAPIKEY.value === "" ||
        printerName.value === "" ||
        printerCamURL.value === ""
      ) {
        if (printerURL.value === "") {
          errors.push({
            type: "warning",
            msg: "Please input your printers URL"
          });
        }
        if (printerAPIKEY.value === "") {
          errors.push({
            type: "warning",
            msg: "Please input your printers API Key"
          });
        }
        if (printCheck > -1) {
          errors.push({
            type: "error",
            msg: `Printer URL: ${printerURL.value} already exists on farm`
          });
        }
      }
      if (errors.length > 0) {
        errors.forEach((error) => {
          UI.createAlert(error.type, error.msg, 3000, "clicked");
        });
      } else {
        const saveButton = document.getElementById(`saveButton-${newId}`);
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        saveButton.disabled = true;

        const printer = new PrintersManagement(
          printerURL.value,
          printerCamURL.value,
          printerAPIKEY.value,
          printerGroup.value,
          printerName.value
        ).build();

        const printerCreatedResponse = await OctoFarmClient.createPrinter(printer);

        UI.createAlert(
          "success",
          `Printer: ${printerCreatedResponse.printerURL} has successfully been added to the farm.`,
          500,
          "Clicked"
        );

        event.parentElement.parentElement.parentElement.remove();
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.disabled = false;
      }
      const table = document.getElementById("printerNewTable");
      if (table.rows.length === 1) {
        if (!table.classList.contains("d-none")) {
          table.classList.add("d-none");
        }
      }
    } catch (e) {
      UI.createAlert(
        "error",
        "Something went wrong saving your printer, please check the logs",
        3000,
        "clicked"
      );
    }
  }

  build() {
    return this.printer;
  }
}
