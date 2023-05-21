/**
 * A generic cache for printer groups
 */
class FloorStore {
  #logger;
  floors = [];

  #floorService;

  constructor({ floorService, loggerFactory }) {
    this.#floorService = floorService;
    this.#logger = loggerFactory(FloorStore.name);
  }

  async loadStore() {
    this.floors = await this.#floorService.list();

    if (!this.floors?.length) {
      this.#logger.log("Creating default floor as non existed");
      const floor = await this.#floorService.createDefaultFloor();
      this.floors.push(floor);
    }
  }

  async listCache() {
    if (!this.floors.length) {
      await this.loadStore();
    }
    return this.floors;
  }

  async create(input, reloadStore = true) {
    const floor = await this.#floorService.create(input);
    if (reloadStore) {
      await this.loadStore();
    }

    return floor;
  }

  async update(floorId, input, reloadStore = true) {
    const floor = await this.#floorService.update(floorId, input);
    if (reloadStore) {
      await this.loadStore();
    }

    return floor;
  }

  async delete(floorId) {
    const deleteResult = await this.#floorService.delete(floorId);
    await this.loadStore();

    return deleteResult;
  }

  async getFloor(floorId) {
    if (!this.floors.length) {
      await this.loadStore();
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
    await this.loadStore();
    return floor;
  }

  async removePrinter(floorId, printerInFloor) {
    const floor = await this.#floorService.removePrinter(floorId, printerInFloor);
    await this.loadStore();
    return floor;
  }

  async removePrinterFromAnyFloor(printerId) {
    return await this.#floorService.deletePrinterFromAnyFloor(printerId);
  }
}

module.exports = FloorStore;
