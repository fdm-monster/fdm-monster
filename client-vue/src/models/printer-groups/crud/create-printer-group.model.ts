import { newRandomNamePair } from "@/constants/noun-adjectives.data";
import { PrinterInGroup } from "@/models/printer-groups/printer-group.model";

export const getDefaultCreatePrinterGroup = (): PreCreatePrinterGroup => ({
  id: undefined,
  name: newRandomNamePair(),
  location: {},
  printers: [],
});

export interface PreCreatePrinterGroup {
  id?: string; // Only in case of update

  name: string;

  printers: PrinterInGroup[];

  location: {
    x?: string;
    y?: string;
  };
}

export interface CreatePrinterGroup {
  id?: string; // Only in case of update

  name: string;

  printers: PrinterInGroup[];

  location: {
    x?: number;
    y?: number;
  };
}
