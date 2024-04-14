import { IFloor } from "@/models/Floor";
import { IdType } from "@/shared.constants";
import { CreateFloorDto, FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { Floor } from "@/entities";
import { FindOptionsWhere } from "typeorm/find-options/FindOptionsWhere";
import { FindOneOptions, FindOptions } from "typeorm";

export interface IFloorService<KeyType = IdType, Entity = IFloor | Floor> {
  addOrUpdatePrinter(floorId: KeyType, position: PositionDto<KeyType>): Promise<Entity>;

  create(input: CreateFloorDto<KeyType>): Promise<Entity>;

  createDefaultFloor(): Promise<Entity>;

  delete(floorId: KeyType): Promise<any | void>;

  deletePrinterFromAnyFloor(printerId: KeyType): Promise<void>;

  get(floorId: KeyType, throwIfNotFound?: boolean, options?: FindOneOptions<Entity>): Promise<Entity>;

  list(): Promise<Entity[]>;

  removePrinter(floorId: KeyType, printerId: KeyType): Promise<Entity>;

  toDto(floor: Entity): FloorDto<KeyType>;

  update(floorId: KeyType, input: UpdateFloorDto<KeyType>): Promise<Entity>;

  updateLevel(floorId: KeyType, level: number): Promise<Entity>;

  updateName(floorId: KeyType, name: string): Promise<Entity>;
}
