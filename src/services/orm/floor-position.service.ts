import { FloorPosition } from "@/entities/floor-position.entity";
import { BaseService } from "@/services/orm/base.service";
import { SqliteIdType } from "@/shared.constants";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { PositionDto } from "@/services/interfaces/floor.dto";

export class FloorPositionService extends BaseService(FloorPosition, PositionDto<SqliteIdType>) {
  constructor(typeormService: TypeormService) {
    super(typeormService);
  }

  async create(dto: PositionDto<SqliteIdType>): Promise<FloorPosition> {
    return super.create(dto);
  }

  findPosition(floorId: SqliteIdType, x: number, y: number) {
    return this.repository.findOneBy({ floorId, x, y });
  }

  /**
   * Find the printer across any floor, usually to see if it has been moved elsewhere.
   * @param printerId The printer which position to be looked up.
   */
  findPrinterPosition(printerId: SqliteIdType) {
    return this.repository.findOneBy({ printerId });
  }

  deletePrinterPositionsByPrinterId(printerId: SqliteIdType) {
    return this.repository.delete({ printerId });
  }

  findPrinterPositionOnFloor(floorId: SqliteIdType, printerId: SqliteIdType) {
    return this.repository.findOneBy({ floorId, printerId });
  }

  toDto(entity: FloorPosition): PositionDto<SqliteIdType> {
    return {
      x: entity.x,
      y: entity.y,
      printerId: entity.printerId,
      floorId: entity.floorId,
    };
  }
}
