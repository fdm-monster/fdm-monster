import { BaseService } from "@/services/orm/base.service";
import { Floor, FloorPosition } from "@/entities";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
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
  extends BaseService(Floor, FloorDto, CreateFloorDto, UpdateFloorDto)
  implements IFloorService
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

  override async get(id: number, options?: FindOneOptions<Floor>): Promise<Floor> {
    return super.get(
      id,
      Object.assign(options || {}, {
        relations: ["printers"],
      }),
    );
  }

  async create(dto: CreateFloorDto): Promise<Floor> {
    const outcome = await validateInput(dto, createOrUpdateFloorSchema);

    const floor = await super.create({
      name: outcome.name,
      order: outcome.order,
      printers: [],
    });

    if (outcome.printers?.length) {
      for (const position of outcome.printers) {
        await this.addOrUpdatePrinter(floor.id, position as PositionDto);
      }
    }

    return this.get(floor.id);
  }

  toDto(floor: Floor): FloorDto {
    return {
      id: floor.id,
      name: floor.name,
      order: floor.order,
      printers: floor.printers.map((p) => ({
        printerId: p.printerId,
        floorId: p.floorId,
        x: p.x,
        y: p.y,
      })),
    };
  }

  /**
   * This is an overwriting method. Any missing data will be deleted, and can cause sql errors if causing wrong constraints.
   * Merge data before calling this function.
   * @param floorId
   * @param update
   */
  async update(floorId: number, update: UpdateFloorDto) {
    const existingFloor = await this.get(floorId);
    const floorUpdate = {
      ...existingFloor,
      name: update.name,
      printers: update.printers,
      order: update.order,
    };
    const validatedFloor = await validateInput(floorUpdate, createOrUpdateFloorSchema);

    // Add new printer positions
    const desiredPositions = validatedFloor.printers;
    if (desiredPositions?.length) {
      for (const printer of desiredPositions) {
        await this.addOrUpdatePrinter(existingFloor.id, printer as PositionDto);
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

  async updateName(floorId: number, floorName: string) {
    const { name } = await validateInput({ name: floorName }, updateFloorNameSchema);

    const floor = await this.get(floorId);
    floor.name = name;
    return this.update(floorId, floor);
  }

  async updateOrder(floorId: number, level: number): Promise<Floor> {
    const { floor: validLevel } = await validateInput({ floor: level }, updateFloorLevelSchema);

    const floor = await this.get(floorId);
    floor.order = validLevel;
    return await this.update(floorId, floor);
  }

  async addOrUpdatePrinter(floorId: number, positionDto: PositionDto): Promise<Floor> {
    // Validation only
    await this.get(floorId);
    positionDto.floorId = floorId;
    const validInput = await validateInput(positionDto, printerInFloorSchema);

    const position = await this.floorPositionService.findPrinterPosition(validInput.printerId);
    // Optimization if position is in desired state already
    if (
      position?.floorId === floorId &&
      position.x === validInput.x &&
      position.y === validInput.y &&
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
      printerId: validInput.printerId,
      floorId,
    });

    await this.floorPositionService.create(newPosition);
    return this.get(floorId);
  }

  async removePrinter(floorId: number, printerId: number): Promise<Floor> {
    const position = await this.floorPositionService.findPrinterPositionOnFloor(floorId, printerId);
    if (!position) {
      throw new NotFoundException("This printer was not found on this floor");
    }
    await this.floorPositionService.delete(position.id);
    return await this.get(floorId);
  }

  async deletePrinterFromAnyFloor(printerId: number): Promise<void> {
    await this.floorPositionService.deletePrinterPositionsByPrinterId(printerId);
  }
}
