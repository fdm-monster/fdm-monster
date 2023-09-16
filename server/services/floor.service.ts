const { Floor } = require("../models/Floor");
const { validateInput } = require("../handlers/validators");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const {
  createFloorRules,
  updateFloorNameRules,
  updateFloorNumberRules,
  printerInFloorRules,
  removePrinterInFloorRules,
  updateFloorRules,
} = require("./validators/floor-service.validation");

export class FloorService {
  /**
   * @type {PrinterCache}
   */
  printerCache;
  #logger;

  constructor({ printerCache, loggerFactory }) {
    this.printerCache = printerCache;
    this.#logger = loggerFactory("PrinterFloorService");
  }

  /**
   * Lists the floors present in the database.
   */
  async list(patchPositions = true) {
    const printers = await this.printerCache.listCachedPrinters(true);
    const printerIds = printers.map((p) => p.id);

    const floors = await Floor.find({});
    if (!patchPositions) {
      return floors;
    }

    for (const floor of floors) {
      if (!floor.printers?.length) continue;

      const removedPositionPrinterIds = [];
      const positionsKnown = {};
      for (const fp of floor.printers) {
        // Remove orphans
        const printerExists = printerIds.includes(fp.printerId.toString());
        if (!printerExists) {
          removedPositionPrinterIds.push(fp.printerId);
          continue;
        }

        // Remove duplicate position, keeping the last added one
        const xyPos = positionsKnown[`${fp.x}${fp.y}`];
        if (!!xyPos) {
          removedPositionPrinterIds.push(xyPos.printerId);
        }

        // Keep last floor printer
        positionsKnown[`${fp.x}${fp.y}`] = fp;
      }

      if (removedPositionPrinterIds?.length) {
        floor.printers = floor.printers.filter((fp) => !removedPositionPrinterIds.includes(fp.printerId));
        await floor.save();
        this.#logger.warn(
          `Found ${removedPositionPrinterIds} (floor printerIds) to be in need of removal for floor (duplicate position or non-existing printer)`
        );
      }
    }

    return floors;
  }

  async get(floorId, throwError = true) {
    const floor = await Floor.findOne({ _id: floorId });
    if (!floor && throwError) {
      throw new NotFoundException(`Floor with id ${floorId} does not exist.`);
    }

    return floor;
  }

  async createDefaultFloor() {
    return await this.create({
      name: "Default Floor",
      floor: 1,
    });
  }

  /**
   * Stores a new floor into the database.
   * @param {Object} floor object to create.
   * @returns {Promise<Floor>}
   * @throws {Error} If the floor is not correctly provided.
   */
  async create(floor) {
    const validatedInput = await validateInput(floor, createFloorRules);
    return Floor.create(validatedInput);
  }

  async update(floorId, input) {
    const existingFloor = await this.get(floorId);
    const { name, floor, printers } = await validateInput(input, updateFloorRules);
    existingFloor.name = name;
    existingFloor.floor = floor;
    existingFloor.printers = printers;
    return await existingFloor.save();
  }

  async updateName(floorId, input) {
    const floor = await this.get(floorId);

    const { name } = await validateInput(input, updateFloorNameRules);
    floor.name = name;
    return await floor.save();
  }

  async updateFloorNumber(floorId, input) {
    const floor = await this.get(floorId);
    const { floor: level } = await validateInput(input, updateFloorNumberRules);
    floor.floor = level;
    return await floor.save();
  }

  async getFloorsOfPrinterId(printerId) {
    return Floor.find({ printers: { $elemMatch: { printerId } } });
  }

  async deletePrinterFromAnyFloor(printerId) {
    return Floor.updateMany(
      {},
      {
        $pull: {
          printers: {
            printerId: {
              $in: [printerId],
            },
          },
        },
      }
    );
  }

  async addOrUpdatePrinter(floorId, printerInFloor) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(printerInFloor, printerInFloorRules);

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    // Ensure position is not taken twice
    floor.printers = floor.printers.filter((pif) => !(pif.x === printerInFloor.x && pif.y === printerInFloor.y));

    const foundPrinterInFloorIndex = floor.printers.findIndex((pif) => pif.printerId.toString() === validInput.printerId);
    if (foundPrinterInFloorIndex !== -1) {
      floor.printers[foundPrinterInFloorIndex] = validInput;
    } else {
      floor.printers.push(validInput);
    }

    await floor.save();
    return floor;
  }

  async removePrinter(floorId, input) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(input, removePrinterInFloorRules);

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    const foundPrinterInFloorIndex = floor.printers.findIndex((pif) => pif.printerId.toString() === validInput.printerId);
    if (foundPrinterInFloorIndex === -1) return floor;
    floor.printers.splice(foundPrinterInFloorIndex, 1);
    await floor.save();
    return floor;
  }

  async delete(floorId) {
    return Floor.deleteOne({ _id: floorId });
  }
}

module.exports = FloorService;
