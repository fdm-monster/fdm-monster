import { IdType } from "@/shared.constants";
import { IsDefined, IsNotEmpty, IsNumber } from "class-validator";

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
  @IsNotEmpty()
  name: string;
  @IsDefined()
  @IsNumber()
  floor: number;
}

export class UpdateFloorDto {
  @IsDefined()
  name?: string;
  @IsDefined()
  @IsNumber()
  floor?: number;
}

export class AddOrUpdatePrinterDto<KeyType = IdType> {
  printerId: KeyType;
}
