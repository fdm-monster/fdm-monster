import Vue from "vue";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { Printer } from "@/models/printers/printer.model";
import { printersState } from "@/store/printers.state";

const bindDropConditionally = (el: HTMLElement, printers: Printer[], context?: Vue) => {
  if (printers?.length) {
    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;

      for (const printer of printers) {
        await dropHandler(e, printer, context);
      }
    };
  } else {
    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;
      alert("The printer(s) input was not correctly bound to be able to do file upload!");
    };
  }
};

const dropHandler = async (e: DragEvent, printer: Printer, context?: Vue) => {
  const files = e.dataTransfer?.files;
  if (!files) return;

  if (files.length === 1) context?.$bus.emit(infoMessageEvent, "Uploading file");
  else context?.$bus.emit(infoMessageEvent, `Uploading ${files.length} files`);

  const uploadInput = {
    printerId: printer.id,
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
      bindDropConditionally(el, binding.value?.printers, vnode.context);
    },
    update: (el, binding, vnode) => {
      bindDropConditionally(el, binding.value?.printers, vnode.context);
    }
  });
}
