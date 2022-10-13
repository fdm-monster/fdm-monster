import { newRandomNamePair } from "@/constants/noun-adjectives.data";

export interface PrinterFloorGroup {
  _id?: string;
  printerGroupId: string;
}

export interface PrinterFloor {
  __v?: number;
  _id?: string;
  name: string;
  floor: number;
  printerGroups: PrinterFloorGroup[];
}

export interface PreCreatePrinterFloor {
  _id?: string;
  name: string;
  floor: string;
  printerGroups: PrinterFloorGroup[];
}

export const getDefaultCreatePrinterFloor = (): PreCreatePrinterFloor => ({
  _id: undefined,
  name: newRandomNamePair(),
  floor: "1",
  printerGroups: [],
});
