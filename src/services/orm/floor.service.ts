import { BaseService } from "@/services/orm/base.service";
import { Floor, FloorPosition } from "@/entities";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { FloorPositionService } from "./floor-position.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { CreateFloorDto, FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { validateInput } from "@/handlers/validators";
import { createFloorRules, updateFloorRules } from "@/services/validators/floor-service.validation";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { FindManyOptions, FindOneOptions, FindOptions } from "typeorm";
import { FindOptionsWhere } from "typeorm/find-options/FindOptionsWhere";

export class FloorService
  extends BaseService(Floor, FloorDto<SqliteIdType>, CreateFloorDto<SqliteIdType>, UpdateFloorDto<SqliteIdType>)
  implements IFloorService<SqliteIdType, Floor>
{
  private floorPositionService: FloorPositionService;

  constructor({
    floorPositionService,
    typeormService,
  }: {
    typeormService: TypeormService;
    floorPositionService: FloorPositionService;
  }) {
    super({ typeormService });
    this.floorPositionService = floorPositionService;
  }

  override async list(options?: FindManyOptions<Floor>): Promise<Floor[]> {
    return super.list(
      Object.assign(options || {}, {
        relations: ["printers"],
      })
    );
  }

  override async get(id: SqliteIdType, throwIfNotFound = true, options?: FindOneOptions<Floor>): Promise<Floor> {
    return super.get(
      id,
      throwIfNotFound,
      Object.assign(options || {}, {
        relations: ["printers"],
      })
    );
  }

  async create(dto: CreateFloorDto<SqliteIdType>): Promise<Floor> {
    await validateInput(dto, createFloorRules);
    const floor = await super.create({
      name: dto.name,
      floor: dto.floor,
      printers: [],
    });

    if (dto.printers?.length) {
      for (const printer of dto.printers) {
        await this.addOrUpdatePrinter(floor.id, printer);
      }
    }

    return this.get(floor.id);
  }

  toDto(floor: Floor): FloorDto<SqliteIdType> {
    return {
      id: floor.id,
      name: floor.name,
      floor: floor.floor,
      printers: floor.printers.map((p) => ({
        printerId: p.printerId,
        floorId: p.floorId,
        x: p.x,
        y: p.y,
      })),
    };
  }

  async createDefaultFloor() {
    const floor = await this.create({
      name: "Default Floor",
      floor: 0,
    });

    return await this.get(floor.id);
  }

  /**
   * This is an overwriting method. Any missing data will be deleted, and can cause sql errors if causing wrong constraints.
   * Merge data before calling this function.
   * @param floorId
   * @param update
   */
  async update(floorId: SqliteIdType, update: UpdateFloorDto<SqliteIdType>) {
    const floor = await this.get(floorId);
    const floorUpdate = {
      ...floor,
      name: update.name,
      printers: update.printers,
      floor: update.floor,
    };

    await validateInput(floorUpdate, updateFloorRules);
    const desiredPositions = floorUpdate.printers;
    if (desiredPositions?.length) {
      for (let printer of desiredPositions) {
        await this.addOrUpdatePrinter(floor.id, printer);
      }
    }
    // Remove any printers that should not exist on floor
    const undesiredPositions = floor.printers.filter((pos) => !desiredPositions.find((dp) => dp.printerId === pos.printerId));
    await this.floorPositionService.deleteMany(undesiredPositions.map((pos) => pos.id));
    delete floorUpdate.printers;

    return super.update(floorId, floorUpdate);
  }

  async updateName(floorId: SqliteIdType, name: string) {
    let floor = await this.get(floorId);
    floor.name = name;
    floor = await this.update(floorId, floor);
    return floor;
  }

  async updateLevel(floorId: SqliteIdType, level: number): Promise<Floor> {
    let floor = await this.get(floorId);
    floor.floor = level;
    floor = await this.update(floorId, floor);
    return floor;
  }

  async addOrUpdatePrinter(floorId: SqliteIdType, positionDto: PositionDto<SqliteIdType>): Promise<Floor> {
    // Validation only
    await this.get(floorId, true);

    const position = await this.floorPositionService.findPrinterPositionOnFloor(floorId, positionDto.printerId as SqliteIdType);
    // Optimization if position is in desired state already
    if (
      position &&
      position.floorId === floorId &&
      position.x === positionDto.x &&
      position.x === positionDto.y &&
      position.printerId === positionDto.printerId
    ) {
      return this.get(floorId);
    }

    // Clean up the printer's position
    if (position) {
      await this.floorPositionService.delete(position.id);
    }

    const xyPosition = await this.floorPositionService.findPosition(floorId, positionDto.x, positionDto.y);
    if (xyPosition) {
      await this.floorPositionService.delete(xyPosition.id);
    }

    const newPosition = new FloorPosition();
    Object.assign(newPosition, {
      x: positionDto.x,
      y: positionDto.y,
      printerId: positionDto.printerId as SqliteIdType,
      floorId: floorId as SqliteIdType,
    });

    await this.floorPositionService.create(newPosition);
    return this.get(floorId);
  }

  async removePrinter(floorId: SqliteIdType, printerId: SqliteIdType): Promise<Floor> {
    const position = await this.floorPositionService.findPrinterPositionOnFloor(floorId, printerId as SqliteIdType);
    if (!position) {
      throw new NotFoundException("This printer was not found on this floor");
    }
    await this.floorPositionService.delete(position.id);
    return await this.get(floorId);
  }

  async deletePrinterFromAnyFloor(printerId: SqliteIdType): Promise<void> {
    await this.floorPositionService.deletePrinterPositionsByPrinterId(printerId);
  }
}
