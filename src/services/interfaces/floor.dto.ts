import { IdDto, IdType } from "@/shared.constants";

export class PositionDto {
  x: number;
  y: number;
  printerId: IdType;
  floorId: IdType;
}

// MongoDB version
export class PrinterInFloorDto extends IdDto {
  x: number;
  y: number;
  printerId: IdType;
}

export class FloorDto extends IdDto {
  name: string;
  level: number;
  positions: PositionDto[];
}

export class CreateFloorDto {
  name: string;
  floor: number;
}

export class UpdateFloorDto {
  name?: string;
  floor?: number;
}

export class AddOrUpdatePrinterDto {
  printerId: IdType;
}
