import { IdType } from "@/shared.constants";
import { IsDefined, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

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
  printers: PositionDto<KeyType>[];
}

export class CreateFloorDto<KeyType> {
  @IsOptional()
  printers?: PositionDto<KeyType>[];
  @IsNotEmpty()
  name: string;
  @IsDefined()
  @IsNumber()
  floor: number;
}

export class UpdateFloorDto<KeyType> {
  @IsOptional()
  printers?: PositionDto<KeyType>[];
  @IsDefined()
  name?: string;
  @IsDefined()
  @IsNumber()
  floor?: number;
}

export class AddOrUpdatePrinterDto<KeyType = IdType> {
  printerId: KeyType;
}
