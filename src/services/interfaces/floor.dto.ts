export class PositionDto {
  x: number;
  y: number;
  printerId: number;
  floorId: number;
}

export class CreatePositionDto {
  x: number;
  y: number;
  printerId: number;
  floorId?: number;
}

export class FloorDto {
  id: number;
  name: string;
  floor: number;
  printers: PositionDto[];
}

export class CreateFloorDto {
  printers?: CreatePositionDto[];
  name: string;
  floor: number;
}

export class UpdateFloorDto {
  printers?: PositionDto[];
  name?: string;
  floor?: number;
}
