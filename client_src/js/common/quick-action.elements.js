import { ACTIONS } from "./quick-action.constants";

export function printerControlBtn(id) {
  return `
    <button  
         title="Control Your Printer"
         id="${ACTIONS.printerButton}-${id}"
         type="button"
         class="tag btn btn-primary btn-sm"
         data-toggle="modal"
         data-target="#printerManagerModal" disabled
         >
            <i class="fas fa-print"></i>
    </button>
    `;
}

export function printerWebBtn(id, webURL) {
  return `
    <a title="Open OctoPrint"
       id="${ACTIONS.printerWeb}-${id}"
       type="button"
       class="tag btn btn-info btn-sm"
       target="_blank"
       href="${webURL}" role="button"><i class="fas fa-globe-europe"></i></a>
  `;
}

export function printerReSyncBtn(id) {
  return `
    <button  
             title="Re-Sync your printer"
             id="${ACTIONS.printerSyncButton}-${id}"
             type="button"
             class="tag btn btn-success btn-sm"
    >
        <i class="fas fa-sync"></i>
    </button>
  `;
}

export function printerQuickConnect(id) {
  return `
    <button  
         title="Quickly connect/disconnect your printer"
         id="${ACTIONS.printerQuickConnect}-${id}"
         type="button"
         class="tag btn btn-danger btn-sm"
         >
            <i class="fas fa-plug-off"></i>
    </button>
    `;
}

export function printerEnableToggle(id) {
  return `
    <button  
         title="Enable/disable your printer in OctoFarm"
         id="${ACTIONS.printerEnableToggle}-${id}"
         type="button"
         class="tag btn btn-danger btn-sm"
         >
            <i class="fas fa-toggle-off"></i>
    </button>
    `;
}

export function powerBtnHolder(id) {
  return `
    <div class="btn-group" id="${ACTIONS.powerBtn}-${id}">
    </div>
  `;
}
