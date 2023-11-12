import { IFloor } from "@/models/Floor";
import { IdType, MongoIdType } from "@/shared.constants";
import {
  AddOrUpdatePrinterDto,
  CreateFloorDto,
  FloorDto,
  PositionDto,
  PrinterInFloorDto,
  UpdateFloorDto,
} from "@/services/interfaces/floor.dto";

export interface IFloorService<KeyType = IdType, Entity = IFloor> {
  toDto(floor: Entity): FloorDto<KeyType>;

  list(): Promise<Entity[]>;

  create(input: CreateFloorDto): Promise<Entity>;

  createDefaultFloor(): Promise<Entity>;

  delete(floorId: KeyType): Promise<any | void>;

  get(floorId: KeyType): Promise<Entity>;

  update(floorId: KeyType, input: UpdateFloorDto): Promise<Entity>;

  updateName(floorId: KeyType, name: string): Promise<Entity>;

  updateLevel(floorId: KeyType, level: number): Promise<Entity>;

  deletePrinterFromAnyFloor(printerId: KeyType): Promise<void>;

  addOrUpdatePrinter(floorId: KeyType, position: AddOrUpdatePrinterDto<KeyType>): Promise<Entity>;

  removePrinter(floorId: KeyType, printerId: KeyType): Promise<Entity>;
}
