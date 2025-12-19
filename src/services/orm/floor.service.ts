import { BaseService } from "@/services/orm/base.service";
import { Floor, FloorPosition } from "@/entities";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { FloorPositionService } from "./floor-position.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { CreateFloorDto, FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { validateInput } from "@/handlers/validators";
import {
  createOrUpdateFloorSchema,
  printerInFloorSchema,
  updateFloorLevelSchema,
  updateFloorNameSchema,
} from "@/services/validators/floor-service.validation";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { FindManyOptions, FindOneOptions } from "typeorm";

export class FloorService
  extends BaseService(Floor, FloorDto<SqliteIdType>, CreateFloorDto<SqliteIdType>, UpdateFloorDto<SqliteIdType>)
  implements IFloorService<SqliteIdType, Floor>
{
  constructor(
    protected readonly typeormService: TypeormService,
    private readonly floorPositionService: FloorPositionService,
  ) {
    super(typeormService);
  }

  override async list(options?: FindManyOptions<Floor>): Promise<Floor[]> {
    return super.list(
      Object.assign(options || {}, {
        relations: ["printers"],
      }),
    );
  }

  override async get(id: SqliteIdType, options?: FindOneOptions<Floor>): Promise<Floor> {
    return super.get(
      id,
      Object.assign(options || {}, {
        relations: ["printers"],
      }),
    );
  }

  async create(dto: CreateFloorDto<SqliteIdType>): Promise<Floor> {
    const outcome = await validateInput(dto, createOrUpdateFloorSchema(true));

    const floor = await super.create({
      name: outcome.name,
      floor: outcome.floor,
      printers: [],
    });

    if (outcome.printers?.length) {
      for (const position of outcome.printers) {
        await this.addOrUpdatePrinter(floor.id, position as PositionDto<number>);
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
      floor: 1,
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
    const existingFloor = await this.get(floorId);
    const floorUpdate = {
      ...existingFloor,
      name: update.name,
      printers: update.printers,
      floor: update.floor,
    };
    const validatedFloor = await validateInput(floorUpdate, createOrUpdateFloorSchema(true));

    // Add new printer positions
    const desiredPositions = validatedFloor.printers;
    if (desiredPositions?.length) {
      for (const printer of desiredPositions) {
        await this.addOrUpdatePrinter(existingFloor.id, printer as PositionDto<SqliteIdType>);
      }

      // Remove any printers that should not exist on floor
      const undesiredPositions = existingFloor.printers.filter(
        (pos) => !desiredPositions.find((dp) => dp.printerId === pos.printerId),
      );
      if (undesiredPositions?.length) {
        await this.floorPositionService.deleteMany(undesiredPositions.map((pos) => pos.id));
      }
    }
    delete floorUpdate.printers;

    // Persist the floor entity changes itself
    return super.update(floorId, floorUpdate);
  }

  async updateName(floorId: SqliteIdType, floorName: string) {
    const { name } = await validateInput({ name: floorName }, updateFloorNameSchema);

    const floor = await this.get(floorId);
    floor.name = name;
    return this.update(floorId, floor);
  }

  async updateLevel(floorId: SqliteIdType, level: number): Promise<Floor> {
    const { floor: validLevel } = await validateInput({ floor: level }, updateFloorLevelSchema);

    const floor = await this.get(floorId);
    floor.floor = validLevel;
    return await this.update(floorId, floor);
  }

  async addOrUpdatePrinter(floorId: SqliteIdType, positionDto: PositionDto<SqliteIdType>): Promise<Floor> {
    // Validation only
    await this.get(floorId);
    positionDto.floorId = floorId;
    const validInput = await validateInput(positionDto, printerInFloorSchema(true));

    const position = await this.floorPositionService.findPrinterPosition(validInput.printerId as SqliteIdType);
    // Optimization if position is in desired state already
    if (
      position &&
      position.floorId === floorId &&
      position.x === validInput.x &&
      position.x === validInput.y &&
      position.printerId === validInput.printerId
    ) {
      return this.get(floorId);
    }

    // Clean up the printer's position
    if (position) {
      await this.floorPositionService.delete(position.id);
    }

    const xyPosition = await this.floorPositionService.findPosition(floorId, validInput.x, validInput.y);
    if (xyPosition) {
      await this.floorPositionService.delete(xyPosition.id);
    }

    const newPosition = new FloorPosition();
    Object.assign(newPosition, {
      x: validInput.x,
      y: validInput.y,
      printerId: validInput.printerId as SqliteIdType,
      floorId,
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
