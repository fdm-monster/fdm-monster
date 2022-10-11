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

  async getSelectedFloor(throwError = false) {
    if (!this.#selectedFloorId) {
      this.#logger.info(
        "Could not provide selected floor, it was not loaded or selected. Was setSelectedFloor initialization called?"
      );
    }

    return this.getFloor(this.#selectedFloorId, throwError);
  }

  async setSelectedFloor(arrayIndex = null) {
    const floors = await this.getFloors();
    if (!floors?.length) {
      this.#logger.info("Creating default floor as non existed");

      const floor = await this.#printerFloorService.create({
        name: "default floor",
        floor: 1,
      });
      this.#selectedFloorId = floor._id;
    } else {
      const index = arrayIndex || 0;
      this.#selectedFloorId = floors[index]._id;
    }

    this.#logger.info(`Set selected floor to id '${this.#selectedFloorId}'`);
  }

  async getFloor(floorId) {
    if (!this.#printerFloors.length) {
      await this.loadCache();
      if (!this.#printerFloors)
        throw new NotFoundException(`Floor with ID ${floorId} was not found`);
    }

    return this.#printerFloors.find((pf) => pf._id.toString() === floorId);
  }

  async getFloors() {
    if (!this.#printerFloors.length) {
      await this.loadCache();
    }
    return this.#printerFloors;
  }

  async loadCache() {
    this.#printerFloors = await this.#printerFloorService.list();
  }
}

module.exports = PrinterFloorsCache;
