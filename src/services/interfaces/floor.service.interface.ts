import { IFloor } from "@/models/Floor";
import { IdType } from "@/shared.constants";
import { CreateFloorDto, FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { Floor } from "@/entities";

export interface IFloorService<KeyType = IdType, Entity = IFloor | Floor> {
  toDto(floor: Entity): FloorDto<KeyType>;

  list(): Promise<Entity[]>;

  create(input: CreateFloorDto<KeyType>): Promise<Entity>;

  createDefaultFloor(): Promise<Entity>;

  delete(floorId: KeyType): Promise<any | void>;

  get(floorId: KeyType): Promise<Entity>;

  update(floorId: KeyType, input: UpdateFloorDto<KeyType>): Promise<Entity>;

  updateName(floorId: KeyType, name: string): Promise<Entity>;

  updateLevel(floorId: KeyType, level: number): Promise<Entity>;

  deletePrinterFromAnyFloor(printerId: KeyType): Promise<void>;

  addOrUpdatePrinter(floorId: KeyType, position: PositionDto<KeyType>): Promise<Entity>;

  removePrinter(floorId: KeyType, printerId: KeyType): Promise<Entity>;
}
