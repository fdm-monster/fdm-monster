import { html } from "lit-html";
import { ACTIONS, CONTAINERS, LABELS } from "../printer-manager.constants";

export const newPrinterTemplate = ({ index, showExample, printer }) => html`
  <tr id="${CONTAINERS.newPrinterCard}-${index}">
    <td>
      <div class="mb-0">
        <input
          id="${LABELS.newPrinterName}-${index}"
          type="text"
          class="form-control"
          placeholder="Leave blank to grab from OctoPrint"
          value="${printer?.name}"
        />
        ${showExample ? "<small>Example: <code>My Awesome Printer Name</code></small>" : ""}
      </div>
    </td>
    <td>
      <div class="mb-0">
        <input
          id="${LABELS.newPrinterGroup}-${index}"
          type="text"
          class="form-control"
          value="${printer?.group}"
        />
        ${showExample ? "<small>Example: <code>Rack 1</code></small>" : ""}
      </div>
    </td>
    <td>
      <div class="mb-0">
        <input
          id="${LABELS.newPrinterURL}-${index}"
          type="text"
          class="form-control"
          value="${printer?.printerURL}"
        />
        ${showExample ? "<small>Example: <code>http://192.168.1.5:80</code></small>" : ""}
      </div>
    </td>
    <td>
      <div class="mb-0">
        <input
          id="${LABELS.newPrinterCamURL}-${index}"
          type="text"
          class="form-control"
          placeholder="Leave blank to grab from OctoPrint"
          value="${printer?.camURL}"
        />
        ${showExample
          ? "<small>Example: <code>http://192.168.1.5/webcam/?action=stream</code></small>"
          : ""}
      </div>
    </td>
    <td>
      <div class="mb-0">
        <input
          id="${LABELS.newPrinterAPIKEY}-${index}"
          type="text"
          class="form-control"
          value="${printer?.apiKey}"
        />
        ${showExample
          ? "<small>OctoPrint Version 1.4.1+: <code>Must use generated User/Application Key</code></small>"
          : ""}
      </div>
    </td>

    <td>
      <button id="${ACTIONS.saveButton}-${index}" type="button" class="btn btn-success btn-sm">
        <i class="fas fa-save"></i>
      </button>
    </td>
    <td>
      <button id="${ACTIONS.delButton}-${index}" type="button" class="btn btn-danger btn-sm">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  </tr>
`;
