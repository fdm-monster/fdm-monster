import { Floor } from "@/entities";
import { IFloor } from "@/models/Floor";
import { IdType } from "@/shared.constants";
import { DeleteResult, FindManyOptions } from "typeorm";
import { FloorDto, PositionDto, PrinterInFloorDto } from "@/services/interfaces/floor.dto";

export interface IFloorService<KeyType = IdType> {
  toDto(floor: Floor | IFloor): FloorDto;

  list(options?: FindManyOptions<Floor>): Promise<Floor[]>;

  create(input: Partial<IFloor | Floor>): Promise<Floor>;

  createDefaultFloor(): Promise<Floor>;

  delete(floorId: KeyType): Promise<DeleteResult | boolean>;

  get(floorId: KeyType): Promise<Floor>;

  update(floorId: KeyType, input: Floor): Promise<Floor>;

  updateName(floorId: KeyType, name: string): Promise<Floor>;

  updateLevel(floorId: KeyType, level: number): Promise<Floor>;

  addOrUpdatePrinter(floorId: KeyType, position: PositionDto | PrinterInFloorDto): Promise<Floor>;

  removePrinter(floorId: KeyType, printerId: KeyType): Promise<Floor>;
}
