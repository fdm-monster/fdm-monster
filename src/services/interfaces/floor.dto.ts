import { IdType } from "@/shared.constants";

export class PositionDto<KeyType = IdType> {
  x: number;
  y: number;
  printerId: KeyType;
  floorId: KeyType;
}

// MongoDB version
export class PrinterInFloorDto<KeyType = IdType> {
  id: KeyType;
  x: number;
  y: number;
  printerId: IdType;
}

export class FloorDto<KeyType = IdType> {
  id: KeyType;
  name: string;
  floor: number;
  printers: PositionDto[];
}

export class CreateFloorDto {
  name: string;
  floor: number;
}

export class UpdateFloorDto {
  name?: string;
  floor?: number;
}

export class AddOrUpdatePrinterDto<KeyType = IdType> {
  printerId: KeyType;
}
