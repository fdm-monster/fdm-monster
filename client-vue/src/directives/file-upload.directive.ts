import Vue from "vue";
import { Printer } from "@/models/printers/printer.model";
import { uploadsState } from "@/store/uploads.state";
import { convertMultiPrinterFileToQueue } from "@/utils/uploads-state.utils";

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
    };
  } else {
    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;
      alert("The printer(s) input was not correctly bound to be able to do file upload!");
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
