const { KeyDiffCache } = require("../utils/cache/key-diff.cache");

/**
 * A generic cache for printer groups
 */
export class FloorStore extends KeyDiffCache {
  /**
   * @type {LoggerService}
   */
  #logger;
  /**
   * @type {FloorService}
   */
  floorService;

  constructor({ floorService, loggerFactory }) {
    super();
    this.floorService = floorService;
    this.#logger = loggerFactory(FloorStore.name);
  }

  async loadStore() {
    const floors = await this.floorService.list();

    if (!floors?.length) {
      this.#logger.log("Creating default floor as non existed");
      const floor = await this.floorService.createDefaultFloor();
      await this.setKeyValue(floor._id, floor, true);
      return;
    }

    const keyValues = floors.map((floor) => ({
      key: floor._id.toString(),
      value: floor,
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

  async create(input) {
    /** @type {Floor} **/
    const floor = await this.floorService.create(input);
    await this.setKeyValue(floor._id, floor, true);
    return floor;
  }

  async delete(floorId) {
    const deleteResult = await this.floorService.delete(floorId);
    await this.deleteKeyValue(floorId);
    return deleteResult;
  }

  async getFloor(floorId) {
    let floor = await this.getValue(floorId);
    if (!!floor) return floor;

    floor = await this.floorService.get(floorId);
    await this.setKeyValue(floorId, floor, true);
    return floor;
  }

  async update(floorId, input) {
    const floor = await this.floorService.update(floorId, input);
    await this.setKeyValue(floorId, floor, true);
    return floor;
  }

  async updateName(floorId, updateSpec) {
    const floor = await this.floorService.updateName(floorId, updateSpec);
    await this.setKeyValue(floorId, floor, true);
    return floor;
  }

  async updateFloorNumber(floorId, updateSpec) {
    const floor = await this.floorService.updateFloorNumber(floorId, updateSpec);
    await this.setKeyValue(floorId, floor, true);
    return floor;
  }

  async addOrUpdatePrinter(floorId, printerInFloor) {
    const floor = await this.floorService.addOrUpdatePrinter(floorId, printerInFloor);
    await this.setKeyValue(floorId, floor, true);
    return floor;
  }

  async removePrinter(floorId, printerInFloor) {
    const floor = await this.floorService.removePrinter(floorId, printerInFloor);
    await this.deleteKeyValue(floorId);
    return floor;
  }

  async removePrinterFromAnyFloor(printerId) {
    await this.floorService.deletePrinterFromAnyFloor(printerId);

    // Bit harsh, but we need to reload the entire store
    await this.loadStore();
  }
}

module.exports = FloorStore;
