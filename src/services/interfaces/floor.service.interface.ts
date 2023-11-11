import { IFloor } from "@/models/Floor";
import { IdType } from "@/shared.constants";
import { FloorDto, PositionDto, PrinterInFloorDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";

export interface IFloorService<KeyType = IdType, Entity = IFloor> {
  toDto(floor: Entity): FloorDto<KeyType>;

  list(): Promise<Entity[]>;

  create(input: Partial<Entity>): Promise<Entity>;

  createDefaultFloor(): Promise<Entity>;

  delete(floorId: KeyType): Promise<any | void>;

  get(floorId: KeyType): Promise<Entity>;

  update(floorId: KeyType, input: UpdateFloorDto): Promise<Entity>;

  updateName(floorId: KeyType, name: string): Promise<Entity>;

  updateLevel(floorId: KeyType, level: number): Promise<Entity>;

  deletePrinterFromAnyFloor(printerId: KeyType): Promise<void>;

  addOrUpdatePrinter(floorId: KeyType, position: PositionDto | PrinterInFloorDto): Promise<Entity>;

  removePrinter(floorId: KeyType, printerId: KeyType): Promise<Entity>;
}
