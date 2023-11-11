import { KeyDiffCache, keyType } from "@/utils/cache/key-diff.cache";
import { LoggerService } from "@/handlers/logger";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { IdType } from "@/shared.constants";
import { IFloor } from "@/models/Floor";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";

export class FloorStore<KeyType extends keyType = IdType> extends KeyDiffCache<FloorDto<KeyType>> {
  private floorService: IFloorService<KeyType>;
  private logger: LoggerService;

  constructor({ floorService, loggerFactory }: { floorService: IFloorService<KeyType>; loggerFactory: ILoggerFactory }) {
    super();
    this.floorService = floorService;
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
      key: floor.id.toString(),
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

  async create(input: Partial<IFloor>) {
    const floor = await this.floorService.create(input);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floor.id, floorDto, true);
    return floorDto;
  }

  async delete(floorId: KeyType) {
    const deleteResult = await this.floorService.delete(floorId);
    await this.deleteKeyValue(floorId);
    return deleteResult;
  }

  async getFloor(floorId: KeyType) {
    let floor = await this.getValue(floorId);
    if (!!floor) return floor;

    const dbFloor = await this.floorService.get(floorId);
    const floorDto = this.floorService.toDto(dbFloor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async update(floorId: KeyType, input: UpdateFloorDto) {
    const floor = await this.floorService.update(floorId, input);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async updateName(floorId: KeyType, name: string) {
    const floor = await this.floorService.updateName(floorId, name);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async updateFloorNumber(floorId: KeyType, floorLevel: number) {
    const floor = await this.floorService.updateLevel(floorId, floorLevel);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async addOrUpdatePrinter(floorId: KeyType, position: PositionDto) {
    const floor = await this.floorService.addOrUpdatePrinter(floorId, position);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async removePrinter(floorId: KeyType, printerId: KeyType) {
    const floor = await this.floorService.removePrinter(floorId, printerId);
    const floorDto = this.floorService.toDto(floor);
    await this.setKeyValue(floorId, floorDto, true);
    return floorDto;
  }

  async removePrinterFromAnyFloor(printerId: KeyType) {
    await this.floorService.deletePrinterFromAnyFloor(printerId);

    // Bit harsh, but we need to reload the entire store
    await this.loadStore();
  }
}
