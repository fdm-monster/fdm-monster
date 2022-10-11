import { newRandomNamePair } from "@/constants/noun-adjectives.data";

export interface PrinterFloor {
  __v?: number;
  _id?: string;
  name: string;
  floor: number;
  printerGroups: string[];
}

export const getDefaultCreatePrinterFloor = (): PrinterFloor => ({
  _id: undefined,
  name: newRandomNamePair(),
  floor: 1,
  printerGroups: [],
});
