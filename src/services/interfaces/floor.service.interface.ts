import { IFloor } from "@/models/Floor";
import { IdType } from "@/shared.constants";
import { CreateFloorDto, CreatePositionDto, FloorDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { Floor } from "@/entities";
import { FindOneOptions } from "typeorm";

export interface IFloorService<KeyType = IdType, Entity = IFloor | Floor> {
  create(input: CreateFloorDto<KeyType>): Promise<Entity>;

  createDefaultFloor(): Promise<Entity>;

  delete(floorId: KeyType): Promise<any | void>;

  addOrUpdatePrinter(floorId: KeyType, position: CreatePositionDto<KeyType>): Promise<Entity>;

  deletePrinterFromAnyFloor(printerId: KeyType): Promise<void>;

  get(floorId: KeyType, throwIfNotFound?: boolean, options?: FindOneOptions<Entity>): Promise<Entity>;

  list(): Promise<Entity[]>;

  removePrinter(floorId: KeyType, printerId: KeyType): Promise<Entity>;

  toDto(floor: Entity): FloorDto<KeyType>;

  update(floorId: KeyType, input: UpdateFloorDto<KeyType>): Promise<Entity>;

  updateLevel(floorId: KeyType, level: number): Promise<Entity>;

  updateName(floorId: KeyType, name: string): Promise<Entity>;
}
