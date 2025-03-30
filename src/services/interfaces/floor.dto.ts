import { IdType } from "@/shared.constants";

export class PositionDto<KeyType = IdType> {
  x: number;
  y: number;
  printerId: KeyType;
  floorId: KeyType;
}

export class FloorDto<KeyType = IdType> {
  id: KeyType;
  name: string;
  floor: number;
  printers: PositionDto<KeyType>[];
}

export class CreateFloorDto<KeyType> {
  printers?: PositionDto<KeyType>[];
  name: string;
  floor: number;
}

export class UpdateFloorDto<KeyType> {
  printers?: PositionDto<KeyType>[];
  name?: string;
  floor?: number;
}
