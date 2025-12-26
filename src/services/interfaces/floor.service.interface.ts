import { CreateFloorDto, CreatePositionDto, FloorDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { Floor } from "@/entities";
import { FindOneOptions } from "typeorm";

export interface IFloorService {
  create(input: CreateFloorDto): Promise<Floor>;

  createDefaultFloor(): Promise<Floor>;

  delete(floorId: number): Promise<void>;

  addOrUpdatePrinter(floorId: number, position: CreatePositionDto): Promise<Floor>;

  deletePrinterFromAnyFloor(printerId: number): Promise<void>;

  get(floorId: number, options?: FindOneOptions<Floor>): Promise<Floor>;

  list(): Promise<Floor[]>;

  removePrinter(floorId: number, printerId: number): Promise<Floor>;

  toDto(floor: Floor): FloorDto;

  update(floorId: number, input: UpdateFloorDto): Promise<Floor>;

  updateLevel(floorId: number, level: number): Promise<Floor>;

  updateName(floorId: number, name: string): Promise<Floor>;
}
