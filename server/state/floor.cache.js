/**
 * A generic cache for printer groups
 */
class FloorCache {
  #logger;
  floors = [];

  #floorService;

  constructor({ floorService, loggerFactory }) {
    this.#floorService = floorService;
    this.#logger = loggerFactory(FloorCache.name);
  }

  async loadCache() {
    this.floors = await this.#floorService.list();

    if (!this.floors?.length) {
      this.#logger.info("Creating default floor as non existed");
      const floor = await this.#floorService.createDefaultFloor();
      this.floors.push(floor);
    }
  }

  async listCache() {
    if (!this.floors.length) {
      await this.loadCache();
    }
    return this.floors;
  }

  async create(input) {
    const floor = await this.#floorService.create(input);
    await this.loadCache();

    return floor;
  }

  async delete(floorId) {
    const deleteResult = await this.#floorService.delete(floorId);
    await this.loadCache();

    return deleteResult;
  }

  async getFloor(floorId) {
    if (!this.floors.length) {
      await this.loadCache();
    }

    const floor = this.floors.find((pf) => pf.id.toString() === floorId);
    if (!!floor) return floor;

    return await this.#floorService.get(floorId);
  }

  async updateName(floorId, updateSpec) {
    await this.#floorService.updateName(floorId, updateSpec);

    const floor = await this.getFloor(floorId);
    floor.name = updateSpec.name;

    return floor;
  }

  async updateFloorNumber(floorId, updateSpec) {
    await this.#floorService.updateFloorNumber(floorId, updateSpec);

    const floor = await this.getFloor(floorId);
    floor.floor = updateSpec.floor;

    return floor;
  }

  async addOrUpdatePrinter(floorId, printerInFloor) {
    const floor = await this.#floorService.addOrUpdatePrinter(floorId, printerInFloor);
    await this.loadCache();
    return floor;
  }

  async removePrinter(floorId, printerInFloor) {
    const floor = await this.#floorService.removePrinter(floorId, printerInFloor);
    await this.loadCache();
    return floor;
  }
}

module.exports = FloorCache;
