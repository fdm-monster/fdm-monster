import { Floor, IFloor } from "@/models/Floor";
import { validateInput } from "@/handlers/validators";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import {
  createFloorRules,
  printerInFloorRules,
  removePrinterInFloorRules,
  updateFloorNameRules,
  updateFloorNumberRules,
  updateFloorRules,
} from "./validators/floor-service.validation";
import { LoggerService } from "@/handlers/logger";
import { PrinterCache } from "@/state/printer.cache";
import { MongoIdType } from "@/shared.constants";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { CreateFloorDto, FloorDto, PrinterInFloorDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class FloorService implements IFloorService<MongoIdType> {
  printerCache: PrinterCache;
  logger: LoggerService;

  constructor({ printerCache, loggerFactory }: { printerCache: PrinterCache; loggerFactory: ILoggerFactory }) {
    this.printerCache = printerCache;
    this.logger = loggerFactory(FloorService.name);
  }

  toDto(floor: IFloor): FloorDto {
    return {
      id: floor.id,
      name: floor.name,
      level: floor.floor,
      positions: floor.printers.map((p) => ({
        x: p.x,
        y: p.y,
        printerId: p.printerId.toString(),
        floorId: floor.id,
      })),
    };
  }

  /**
   * Lists the floors present in the database.
   */
  async list(patchPositions = true) {
    const printers = await this.printerCache.listCachedPrinters(true);
    // const printerIds = printers.map((p) => p.id);

    const floors = await Floor.find({});
    if (!patchPositions) {
      return floors;
    }

    // TODO this does more harm than good
    // for (const floor of floors) {
    //   if (!floor.printers?.length) continue;

    // const removedPositionPrinterIds: MongoIdType[] = [];

    // TODO this is prone to collisions
    // const positionsKnown: { [k: string]: any } = {};
    // for (const fp of floor.printers) {
    //   // Remove orphans
    //   const stringPrinterId = fp.printerId.toString();
    //   const printerExists = printerIds.includes(stringPrinterId);
    //   if (!printerExists) {
    //     removedPositionPrinterIds.push(stringPrinterId);
    //     continue;
    //   }
    //
    //   // Remove duplicate position, keeping the last added one
    //   const xyPos = positionsKnown[`${fp.x}${fp.y}`];
    //   if (!!xyPos) {
    //     removedPositionPrinterIds.push(xyPos.printerId);
    //   }
    //
    //   // Keep last floor printer
    //   positionsKnown[`${fp.x}${fp.y}`] = fp;
    // }
    //
    // if (removedPositionPrinterIds?.length) {
    //   floor.printers = floor.printers.filter((fp) => !removedPositionPrinterIds.includes(fp.printerId));
    //   await floor.save();
    //   this.logger.warn(
    //     `Found ${removedPositionPrinterIds} (floor printerIds) to be in need of removal for floor (duplicate position or non-existing printer)`
    //   );
    // }
    // }

    return floors;
  }

  async get(floorId: MongoIdType, throwError = true) {
    const floor = await Floor.findOne({ _id: floorId });
    if (!floor && throwError) {
      throw new NotFoundException(`Floor with id ${floorId} does not exist.`);
    }

    return floor!;
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
  async create(floor: CreateFloorDto) {
    const validatedInput = await validateInput(floor, createFloorRules);
    return Floor.create(validatedInput);
  }

  async update(floorId: MongoIdType, input: UpdateFloorDto) {
    const existingFloor = await this.get(floorId);
    const { name, floor, printers } = await validateInput(input, updateFloorRules);
    existingFloor.name = name;
    existingFloor.floor = floor;
    existingFloor.printers = printers;
    return await existingFloor.save();
  }

  async updateName(floorId: MongoIdType, floorName: string) {
    const floor = await this.get(floorId);
    const { name } = await validateInput(floorName, updateFloorNameRules);
    floor.name = name;
    return await floor.save();
  }

  async updateLevel(floorId: MongoIdType, level: number) {
    const floor = await this.get(floorId);
    const { floor: validLevel } = await validateInput({ floor: level }, updateFloorNumberRules);
    floor.floor = validLevel;
    return await floor.save();
  }

  async getFloorsOfPrinterId(printerId: MongoIdType) {
    return Floor.find({ printers: { $elemMatch: { printerId } } });
  }

  async deletePrinterFromAnyFloor(printerId: MongoIdType) {
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

  async addOrUpdatePrinter(floorId: MongoIdType, printerInFloor: PrinterInFloorDto) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(printerInFloor, printerInFloorRules);

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    // Ensure position is not taken twice
    floor.printers = floor.printers.filter(
      (pif: PrinterInFloorDto) => !(pif.x === printerInFloor.x && pif.y === printerInFloor.y)
    );

    const foundPrinterInFloorIndex = floor.printers.findIndex(
      (pif: PrinterInFloorDto) => pif.printerId.toString() === validInput.printerId
    );
    if (foundPrinterInFloorIndex !== -1) {
      floor.printers[foundPrinterInFloorIndex] = validInput;
    } else {
      floor.printers.push(validInput);
    }

    await floor.save();
    return floor;
  }

  async removePrinter(floorId: MongoIdType, printerId: MongoIdType) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput({ printerId }, removePrinterInFloorRules);

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    const foundPrinterInFloorIndex = floor.printers.findIndex(
      (pif: PrinterInFloorDto) => pif.printerId.toString() === validInput.printerId
    );
    if (foundPrinterInFloorIndex === -1) return floor;
    floor.printers.splice(foundPrinterInFloorIndex, 1);
    await floor.save();
    return floor;
  }

  async delete(floorId: MongoIdType) {
    return Floor.deleteOne({ _id: floorId });
  }
}
