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
  order: number;
  printers: PositionDto[];
}

export class CreateFloorDto {
  printers?: CreatePositionDto[];
  name: string;
  order: number;
}

export class UpdateFloorDto {
  printers?: PositionDto[];
  name?: string;
  order?: number;
}
