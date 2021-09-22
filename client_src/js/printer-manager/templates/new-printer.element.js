import { LitElement, html } from "lit";
import { ACTIONS, CONTAINERS, LABELS } from "../printer-manager.constants";
import { PrintersManagement } from "../printer-manager.runner";

export class NewPrinterRowElement extends LitElement {
  static properties = {
    index: { type: Number },
    showExample: { type: Boolean },
    printer: { type: Object }
  };

  constructor({ index, showExample, printer }) {
    super();
    this.index = index;
    this.showExample = showExample;
    this.printer = printer;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("asd");
  }

  async _clickSave(event) {
    await PrintersManagement.savePrinter(event.target.id);
  }

  render() {
    return html`
      <tr id="${CONTAINERS.newPrinterCard}-${this.index}">
        <td>
          <div class="mb-0">
            <input
              id="${LABELS.newPrinterName}-${this.index}"
              type="text"
              class="form-control"
              placeholder="Leave blank to grab from OctoPrint"
              value="${this.printer?.name}"
            />
            ${this.showExample
              ? "<small>Example: <code>My Awesome Printer Name</code></small>"
              : ""}
          </div>
        </td>
        <td>
          <div class="mb-0">
            <input
              id="${LABELS.newPrinterGroup}-${this.index}"
              type="text"
              class="form-control"
              value="${this.printer?.group}"
            />
            ${this.showExample ? "<small>Example: <code>Rack 1</code></small>" : ""}
          </div>
        </td>
        <td>
          <div class="mb-0">
            <input
              id="${LABELS.newPrinterURL}-${this.index}"
              type="text"
              class="form-control"
              value="${this.printer?.printerURL}"
            />
            ${this.showExample ? "<small>Example: <code>http://192.168.1.5:80</code></small>" : ""}
          </div>
        </td>
        <td>
          <div class="mb-0">
            <input
              id="${LABELS.newPrinterCamURL}-${this.index}"
              type="text"
              class="form-control"
              placeholder="Leave blank to grab from OctoPrint"
              value="${this.printer?.camURL}"
            />
            ${this.showExample
              ? "<small>Example: <code>http://192.168.1.5/webcam/?action=stream</code></small>"
              : ""}
          </div>
        </td>
        <td>
          <div class="mb-0">
            <input
              id="${LABELS.newPrinterAPIKEY}-${this.index}"
              type="text"
              class="form-control"
              value="${this.printer?.apiKey}"
            />
            ${this.showExample
              ? "<small>OctoPrint Version 1.4.1+: <code>Must use generated User/Application Key</code></small>"
              : ""}
          </div>
        </td>

        <td>
          <button
            id="${ACTIONS.saveButton}-${this.index}"
            @click="${this._clickSave}"
            type="button"
            class="btn btn-success btn-sm"
          >
            <i class="fas fa-save"></i>
          </button>
        </td>
        <td>
          <button
            id="${ACTIONS.delButton}-${this.index}"
            type="button"
            class="btn btn-danger btn-sm"
          >
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }
}
customElements.define("new-printer-row", NewPrinterRowElement);
