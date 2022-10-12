import { newRandomNamePair } from "@/constants/noun-adjectives.data";

export interface PrinterFloor {
  __v?: number;
  _id?: string;
  name: string;
  floor: number;
  printerGroups: string[];
}

export interface PreCreatePrinterFloor {
  _id?: string;
  name: string;
  floor: string;
  printerGroups: string[];
}

export const getDefaultCreatePrinterFloor = (): PreCreatePrinterFloor => ({
  _id: undefined,
  name: newRandomNamePair(),
  floor: "1",
  printerGroups: [],
});
