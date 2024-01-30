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

  async create(dto: CreateFloorDto<SqliteIdType>): Promise<Floor> {
    await validateInput(dto, createFloorRules);
    const floor = await super.create({
      name: dto.name,
      floor: dto.floor,
      printers: [],
    });

    const printers = dto.printers;
    if (printers?.length) {
      for (let printer of printers) {
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

  async update(floorId: SqliteIdType, update: UpdateFloorDto<SqliteIdType>) {
    const floor = await this.get(floorId);
    const floorUpdate = Object.assign(floor, update);
    await validateInput(floorUpdate, updateFloorRules);
    const printers = floorUpdate.printers;
    if (printers?.length) {
      for (let printer of printers) {
        await this.addOrUpdatePrinter(floor.id, printer);
      }
    }
    delete floorUpdate.printers;

    return super.update(floorId, floorUpdate);
  }

  async updateName(floorId: SqliteIdType, name: string) {
    let floor = await this.get(floorId);
    floor.name = name;
    floor = await this.update(floorId, { name });
    return floor;
  }

  async updateLevel(floorId: SqliteIdType, level: number): Promise<Floor> {
    let floor = await this.get(floorId);
    floor.floor = level;
    floor = await this.update(floorId, { floor: level });
    return floor;
  }

  async addOrUpdatePrinter(floorId: SqliteIdType, positionDto: PositionDto<SqliteIdType>): Promise<Floor> {
    const floor = await this.get(floorId);

    const position = await this.floorPositionService.findPrinterPosition(positionDto.printerId as SqliteIdType);
    if (position) {
      await this.floorPositionService.delete(position.id);
    }

    const xyPosition = await this.floorPositionService.findPosition(positionDto.x, positionDto.y);
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
