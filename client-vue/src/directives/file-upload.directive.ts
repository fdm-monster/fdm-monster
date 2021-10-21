import Vue from "vue";
import { Printer } from "@/models/printers/printer.model";
import { uploadsState } from "@/store/uploads.state";
import { convertMultiPrinterFileToQueue } from "@/utils/uploads-state.utils";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { printersState } from "@/store/printers.state";

const bindDropConditionally = (el: HTMLElement, printers: Printer[], context?: Vue) => {
  if (printers?.length) {
    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;

      if (!e.dataTransfer?.files.length) return;

      const files = [...e.dataTransfer?.files];
      const file = files[0];

      const uploads = convertMultiPrinterFileToQueue(printers, file);
      uploadsState.queueUploads(uploads);

      printersState.clearSelectedPrinters();
    };
  } else {
    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;
      context?.$bus.emit(infoMessageEvent, "Please select a printer to upload to first.");
    };
  }
};

const defaultBorder = "1px solid #2b2a27";
const defaultTransition = "background-color 0.5s ease";
const hoverBorder = "1px solid red";

export function registerFileDropDirective() {
  Vue.directive("drop-upload", {
    // When the bound element is inserted into the DOM...
    inserted: (el, binding, vnode) => {
      el.style.border = defaultBorder;
      el.style.transition = defaultTransition;

      el.ondragenter = () => {
        el.style.border = hoverBorder;
      };
      el.ondragover = (ev) => {
        el.style.border = hoverBorder;
        ev.preventDefault();
      };
      el.ondragleave = () => {
        el.style.border = defaultBorder;
      };

      // The bound printer is not set
      bindDropConditionally(el, binding.value?.printers, vnode.context);
    },
    update: (el, binding, vnode) => {
      bindDropConditionally(el, binding.value?.printers, vnode.context);
    }
  });
}
