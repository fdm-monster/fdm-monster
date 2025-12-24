import { FloorPosition } from "@/entities/floor-position.entity";
import { BaseService } from "@/services/orm/base.service";
import { PositionDto } from "@/services/interfaces/floor.dto";

export class FloorPositionService extends BaseService(FloorPosition, PositionDto) {
  async create(dto: PositionDto): Promise<FloorPosition> {
    return super.create(dto);
  }

  findPosition(floorId: number, x: number, y: number) {
    return this.repository.findOneBy({ floorId, x, y });
  }

  /**
   * Find the printer across any floor, usually to see if it has been moved elsewhere.
   * @param printerId The printer which position to be looked up.
   */
  findPrinterPosition(printerId: number) {
    return this.repository.findOneBy({ printerId });
  }

  deletePrinterPositionsByPrinterId(printerId: number) {
    return this.repository.delete({ printerId });
  }

  findPrinterPositionOnFloor(floorId: number, printerId: number) {
    return this.repository.findOneBy({ floorId, printerId });
  }

  toDto(entity: FloorPosition): PositionDto {
    return {
      x: entity.x,
      y: entity.y,
      printerId: entity.printerId,
      floorId: entity.floorId,
    };
  }
}
