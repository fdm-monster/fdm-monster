import { CONTAINERS } from "../printer-manager.constants";
import "./new-printer.element";
import { newPrinterRowTemplate } from "./new-printer.element";
import { html } from "lit-html";

export class NewPrinterTableElement {
  constructor() {
    this.newPrinters = [];
    this.headers = [
      { title: "Name", style: "" },
      { title: "Group", style: "min-width:190px;" },
      { title: "Printer URL", style: "" },
      { title: "Camera URL", style: "" },
      { title: "Api Key", style: "" },
      {
        title:
          '<button id="saveAllBtn" type="button" class="btn btn-success btn-sm"><i class="fas fa-save"></i></button>',
        style: "max-width:50px;"
      },
      {
        title:
          '<button id="delAllBtn" type="button" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>',
        style: "max-width:50px;"
      }
    ];
  }

  tableHidden() {
    return this.newPrinters.length === 0 ? "d-none" : "";
  }

  render() {
    return html`
      <div class="col-lg-12 mt-2 table-responsive-sm table-responsive-md">
        <table
          id="${CONTAINERS.printerNewTable}"
          class="table table-dark table-striped text-center"
        >
          <thead>
            <tr>
              ${this.headers.map(
                (h) =>
                  html` <th scope="col" class="sticky-table table-dark" style="${h.style}">
                    ${h.title}
                  </th>`
              )}
            </tr>
          </thead>
          <tbody id="${CONTAINERS.newPrinterList}" style="height:100%; overflow-y:auto;">
            ${this.newPrinters.map((p, index) =>
              newPrinterRowTemplate({ printer: p, index, showExample: true })
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}
