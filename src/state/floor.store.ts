import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { LoggerService } from "@/handlers/logger";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { CreateFloorDto, FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";

export class FloorStore extends KeyDiffCache<FloorDto> {
  private readonly logger: LoggerService;

  constructor(
    private readonly floorService: IFloorService,
    loggerFactory: ILoggerFactory,
  ) {
    super();
    this.logger = loggerFactory(FloorStore.name);
  }

  async loadStore() {
    const floors = await this.floorService.list();

    if (!floors?.length) {
      this.logger.log("Creating default floor as non existed");
      const floor = await this.floorService.createDefaultFloor();
      const floorDto = this.floorService.toDto(floor);
      await this.setKeyValue(floor.id, floorDto, true);
      return;
    }

    const keyValues = floors.map((floor) => ({
      key: floor.id,
      value: this.floorService.toDto(floor),
    }));
    await this.setKeyValuesBatch(keyValues, true);
  }

  async listCache() {
    const floors = await this.getAllValues();
    if (floors?.length) {
      return floors;
    }

    await this.loadStore();
    return await this.getAllValues();
  }

  async create(input: CreateFloorDto) {
    const floor = await this.floorService.create(input);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floor.id, floorDto, true);
    return floorDto;
  }

  async delete(floorId: number) {
    await this.floorService.delete(floorId);
    await this.deleteKeyValue(floorId);
  }

  async getFloor(floorId: number) {
    let floor = await this.getValue(floorId);
    if (floor) {
      return floor;
    }

    const dbFloor = await this.floorService.get(floorId);
    const floorDto = this.floorService.toDto(dbFloor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async update(floorId: number, input: UpdateFloorDto) {
    const floor = await this.floorService.update(floorId, input);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async updateName(floorId: number, name: string) {
    const floor = await this.floorService.updateName(floorId, name);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async updateFloorNumber(floorId: number, floorLevel: number) {
    const floor = await this.floorService.updateLevel(floorId, floorLevel);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async addOrUpdatePrinter(floorId: number, position: PositionDto) {
    const floor = await this.floorService.addOrUpdatePrinter(floorId, position);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async removePrinter(floorId: number, printerId: number) {
    const floor = await this.floorService.removePrinter(floorId, printerId);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async removePrinterFromAnyFloor(printerId: number) {
    await this.floorService.deletePrinterFromAnyFloor(printerId);

    // Bit harsh, but we need to reload the entire store
    await this.loadStore();
  }
}
