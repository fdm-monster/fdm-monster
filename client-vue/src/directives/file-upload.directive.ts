import Vue from "vue";
import { Printer } from "@/models/printers/printer.model";
import {
  convertMultiPrinterFileToQueue,
  convertPrinterMultiFileToQueue,
} from "@/utils/uploads-state.utils";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { usePrintersStore } from "@/store/printers.store";
import { useUploadsStore } from "@/store/uploads.store";

const bindDropConditionally = (el: HTMLElement, printers: Printer[], context?: Vue) => {
  const printersStore = usePrintersStore();
  const uploadsStore = useUploadsStore();
  if (printers?.length) {
    const isSinglePrinter = printers.length === 1;
    const firstPrinter = printers[0];

    el.ondrop = async (e) => {
      e.preventDefault();
      el.style.border = defaultBorder;

      const filesArray = e.dataTransfer?.files;
      if (!filesArray?.length) return;

      const clonedFiles = [...Array.from(filesArray)];
      let convertedUploads = [];
      if (isSinglePrinter) {
        const printedFilename = clonedFiles.length === 1 ? clonedFiles[0].name : null;
        console.debug(
          "Single printer upload mode",
          printers.length,
          clonedFiles.length,
          printedFilename
        );

        // Convert the file and bound printer to a file upload
        convertedUploads = convertPrinterMultiFileToQueue(
          firstPrinter,
          clonedFiles,
          printedFilename,
          printersStore.bedTempOverride,
          printersStore.bedTemp
        );
      } else {
        if (clonedFiles.length > 1) {
          throw "Cannot upload multiple files to multiple printers";
        }
        console.debug("Multi printer upload mode", printers.length, clonedFiles.length);
        const clonedFile = clonedFiles[0];
        convertedUploads = convertMultiPrinterFileToQueue(printers, clonedFile, {
          select: true,
          print: true,
          overrideBedTemp: printersStore.bedTempOverride,
          bedTemp: printersStore.bedTemp,
        });
      }

      uploadsStore.queueUploads(convertedUploads);

      printersStore.clearSelectedPrinters();
      printersStore.resetBedTempOverride();
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
    },
  });
}
