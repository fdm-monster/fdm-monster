import Vue from "vue";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { Printer } from "@/models/printers/printer.model";
import { printersState } from "@/store/printers.state";

const bindDropConditionally = (el: HTMLElement, printer: Printer, context?: Vue) => {
  if (printer) {
    el.ondrop = async (e) => {
      el.style.border = defaultBorder;

      await dropHandler(e, printer, context);
    };
  } else {
    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;
      alert("The printer was not correctly bound to be able to do file upload!");
    };
  }
};

const dropHandler = async (e: DragEvent, printer: Printer, context?: Vue) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files) return;

  const printerId = printer.id;

  if (files.length === 1) context?.$bus.emit(infoMessageEvent, "Uploading file");
  else context?.$bus.emit(infoMessageEvent, `Uploading ${files.length} files`);

  const uploadInput = {
    printerId,
    files: Array.from(files)
  };
  await printersState.dropUploadPrinterFile(uploadInput);

  context?.$bus.emit(infoMessageEvent, `Upload done`);
};

const defaultBorder = "1px solid #2b2a27";
const hoverBorder = "1px solid red";

export function registerFileDropDirective() {
  Vue.directive("drop-upload", {
    // When the bound element is inserted into the DOM...
    inserted: (el, binding, vnode) => {
      el.style.border = defaultBorder;

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
      bindDropConditionally(el, binding.value?.printer, vnode.context);
    },
    update: (el, binding, vnode) => {
      bindDropConditionally(el, binding.value?.printer, vnode.context);
    }
  });
}
