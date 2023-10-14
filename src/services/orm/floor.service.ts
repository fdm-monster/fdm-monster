import { BaseService } from "@/services/orm/base.service";
import { Floor, FloorPosition } from "@/entities";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { FloorPositionService } from "./floor-position.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { FloorDto, PositionDto } from "@/services/interfaces/floor.dto";
import { validateInput } from "@/handlers/validators";
import { createFloorRules } from "@/services/validators/floor-service.validation";

export class FloorService extends BaseService(Floor, FloorDto<SqliteIdType>) implements IFloorService<SqliteIdType, Floor> {
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

  async create(dto: Partial<Floor>): Promise<Floor> {
    const validatedInput = await validateInput(dto, createFloorRules);
    return super.create(dto);
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

  async addOrUpdatePrinter(floorId: SqliteIdType, positionDto: PositionDto): Promise<Floor> {
    const floor = await this.get(floorId);

    const position = await this.floorPositionService.findPrinterPosition(positionDto.printerId as SqliteIdType);
    if (position) {
      await this.floorPositionService.delete(position.id);
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
    await this.floorPositionService.delete(position!.id);
    return await this.get(floorId);
  }

  async deletePrinterFromAnyFloor(printerId: SqliteIdType): Promise<void> {
    await this.floorPositionService.deletePrinterPositionsByPrinterId(printerId);
  }
}
