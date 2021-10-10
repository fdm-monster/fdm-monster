import Vue from "vue";
import { printersState } from "@/store/printers/printers";

const dropHandler = async (e: DragEvent) => {
  e.preventDefault();
  console.debug("File(s) dropped", e.dataTransfer?.files);
  if (!e.dataTransfer?.files) return;

  await printersState.dropUploadPrinterFile({ printerId: "asd", files: e.dataTransfer.files });
};

const defaultBorder = "1px solid #2b2a27";
const hoverBorder = "1px solid red";

export function registerFileDropDirective() {
  Vue.directive("focus", {
    // When the bound element is inserted into the DOM...
    inserted: function (el, binding, vnode) {
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
      el.ondrop = (e) => {
        el.style.border = defaultBorder;
        dropHandler(e);
      };
    }
  });
}
