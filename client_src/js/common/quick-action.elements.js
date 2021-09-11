import { ACTIONS } from "./quick-action.constants";
import { withId } from "./element.utils";

function button({ id, link = false, classList, title, icon, customTags }) {
  const titleTag = title ? `title="${title}"` : "";
  const idTag = `id="${id}"`;
  const tag = link ? "a" : "button";
  const classTag = `class="${classList}"`;
  const iconTag = `<i class="fas ${icon}"></i>`;

  return `
    <${tag}
        ${idTag}
        ${classTag}
        ${titleTag}
        type="button"
        ${customTags || ""}
    >
        ${iconTag}
    </${tag}>
    `;
}

export function printerControlBtn(id) {
  return button({
    title: "Control Your Printer",
    id: withId(ACTIONS.printerButton, id),
    classList: "tag btn btn-primary btn-sm",
    icon: "fa-plug",
    customTags: `data-toggle="modal" data-target="#printerManagerModal" disabled`
  });
}

export function printerWebBtn(id, webURL) {
  return button({
    title: "Open OctoPrint",
    link: true,
    id: withId(ACTIONS.printerWeb, id),
    classList: "tag btn btn-sm btn-info",
    icon: "fa-globe-europe",
    customTags: `target="_blank" href="${webURL}" role="button"`
  });
}

export function printerReSyncBtn(id) {
  return button({
    title: "Re-Sync your printer",
    id: withId(ACTIONS.printerSyncButton, id),
    classList: "tag btn btn-sm btn-success",
    icon: "fa-sync"
  });
}

export function printerQuickConnect(id) {
  return button({
    title: "Quickly connect/disconnect your printer",
    id: withId(ACTIONS.printerQuickConnect, id),
    classList: "tag btn btn-sm btn-danger",
    icon: "fa-plug-off"
  });
}

export function printerEnableToggle(id) {
  return button({
    title: "Enable/disable your printer in OctoFarm",
    id: withId(ACTIONS.printerEnableToggle, id),
    classList: "tag btn btn-sm btn-danger",
    icon: "fa-toggle-off"
  });
}

export function powerBtnHolder(id) {
  return `
    <div class="btn-group" id="${ACTIONS.powerBtn}-${id}">
    </div>
  `;
}
