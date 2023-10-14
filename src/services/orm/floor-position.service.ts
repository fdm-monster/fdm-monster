import { FloorPosition } from "@/entities/floor-position.entity";
import { BaseService } from "@/services/orm/base.service";
import { SqliteIdType } from "@/shared.constants";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { PositionDto } from "@/services/interfaces/floor.dto";

export class FloorPositionService extends BaseService(FloorPosition, PositionDto<SqliteIdType>) {
  constructor({ typeormService }: { typeormService: TypeormService }) {
    super({ typeormService });
  }

  findPrinterPosition(printerId: SqliteIdType) {
    return this.repository.findOneBy({ id: printerId });
  }

  deletePrinterPositionsByPrinterId(printerId: SqliteIdType) {
    return this.repository.delete({ id: printerId });
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
