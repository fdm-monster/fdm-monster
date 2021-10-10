import Vue from "vue";
import { printersState } from "@/store/printers.state";
import { DirectiveBinding } from "vue/types/options";
import { infoMessageEvent } from "@/event-bus/alert.events";

function getPrinterId(binding: DirectiveBinding) {
  return binding.value?.item.id;
}

const dropHandler = async (e: DragEvent, binding: DirectiveBinding, context?: Vue) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files) return;

  const printerId = getPrinterId(binding);

  if (files.length === 1) context?.$bus.emit(infoMessageEvent, "Uploading file");
  else context?.$bus.emit(infoMessageEvent, `Uploading ${files.length} files`);

  const uploadInput = {
    printerId,
    files
  };
  await printersState.dropUploadPrinterFile(uploadInput);

  context?.$bus.emit(infoMessageEvent, `Upload done`);
};

const defaultBorder = "1px solid #2b2a27";
const hoverBorder = "1px solid red";

export function registerFileDropDirective() {
  Vue.directive("focus", {
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
      el.ondrop = async (e) => {
        el.style.border = defaultBorder;
        await dropHandler(e, binding, vnode.context);
      };
    }
  });
}
