/**
 * A generic cache for printer groups
 */
const { NotFoundException } = require("../../exceptions/runtime.exceptions");

class PrinterFloorsCache {
  #logger;
  // Data array
  #printerFloors = [];
  #selectedFloorId;

  #printerFloorService;

  constructor({ printerFloorService, loggerFactory }) {
    this.#printerFloorService = printerFloorService;
    this.#logger = loggerFactory(PrinterFloorsCache.name);
  }

  async loadCache() {
    this.#printerFloors = await this.#printerFloorService.list();
  }

  async listCache() {
    if (!this.#printerFloors.length) {
      await this.loadCache();
    }
    return this.#printerFloors;
  }

  async create(input) {
    const floor = await this.#printerFloorService.create(input);
    await this.loadCache();

    return floor;
  }

  async delete(floorId) {
    const deleteResult = await this.#printerFloorService.delete(floorId);
    await this.loadCache();

    return deleteResult;
  }

  async getSelectedFloor(throwError = false) {
    if (!this.#selectedFloorId) {
      this.#logger.info(
        "Could not provide selected floor, it was not loaded or selected. Initializing now"
      );
      await this.setSelectedFloor();
    }

    return this.getFloor(this.#selectedFloorId, throwError);
  }

  async setSelectedFloor(floorId = null) {
    const floors = await this.listCache();
    if (!floors?.length) {
      this.#logger.info("Creating default floor as non existed");
      const floor = await this.#printerFloorService.createDefaultFloor();
      await this.loadCache();
      this.#selectedFloorId = floor.id;
    } else {
      if (floorId) {
        const foundFloor = await this.getFloor(floorId);
        this.#selectedFloorId = foundFloor.id || null;
      } else {
        this.#selectedFloorId = floors[0].id;
      }
    }

    this.#logger.info(`Set selected floor to id '${this.#selectedFloorId}'`);
  }

  async getFloor(floorId) {
    if (!this.#printerFloors.length) {
      await this.loadCache();
      if (!this.#printerFloors) {
        throw new NotFoundException(`Floor with ID ${floorId} was not found`);
      }
    }

    const floor = this.#printerFloors.find((pf) => pf.id.toString() === floorId);
    if (!!floor) return floor;

    return await this.#printerFloorService.get(floorId);
  }

  async updateName(floorId, updateSpec) {
    await this.#printerFloorService.updateName(floorId, updateSpec);

    const floor = await this.getFloor(floorId);
    floor.name = updateSpec.name;

    return floor;
  }

  async updateFloorNumber(floorId, updateSpec) {
    await this.#printerFloorService.updateFloorNumber(floorId, updateSpec);

    const floor = await this.getFloor(floorId);
    floor.floor = updateSpec.floor;

    return floor;
  }

  async addOrUpdatePrinterGroup(floorId, printerGroupInFloor) {
    const floor = await this.#printerFloorService.addOrUpdatePrinterGroup(
      floorId,
      printerGroupInFloor
    );
    await this.loadCache();
    return floor;
  }

  async removePrinterGroup(floorId, printerGroupInFloor) {
    const floor = await this.#printerFloorService.removePrinterGroup(floorId, printerGroupInFloor);
    await this.loadCache();
    return floor;
  }
}

module.exports = PrinterFloorsCache;
