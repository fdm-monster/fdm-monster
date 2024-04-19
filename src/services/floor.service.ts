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
import {
  AddOrUpdatePrinterDto,
  CreateFloorDto,
  FloorDto,
  PrinterInFloorDto,
  UpdateFloorDto,
} from "@/services/interfaces/floor.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class FloorService implements IFloorService<MongoIdType> {
  printerCache: PrinterCache;
  logger: LoggerService;

  constructor({ printerCache, loggerFactory }: { printerCache: PrinterCache; loggerFactory: ILoggerFactory }) {
    this.printerCache = printerCache;
    this.logger = loggerFactory(FloorService.name);
  }

  toDto(floor: IFloor): FloorDto<MongoIdType> {
    return {
      id: floor.id,
      name: floor.name,
      floor: floor.floor,
      printers: floor.printers?.map((p) => ({
        x: p.x,
        y: p.y,
        printerId: p.printerId.toString(),
        floorId: floor.id,
      })),
    };
  }

  async list(patchPositions = true) {
    const floors = await Floor.find({});
    if (!patchPositions) {
      return floors;
    }

    return floors;
  }

  async get(floorId: MongoIdType, throwError = true) {
    const floor = await Floor.findOne({ _id: floorId });
    if (!floor && throwError) {
      throw new NotFoundException(`Floor with provided id does not exist`);
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
   */
  async create(floor: CreateFloorDto<MongoIdType>) {
    const validatedInput = await validateInput(floor, createFloorRules);
    return Floor.create(validatedInput);
  }

  async update(floorId: MongoIdType, input: UpdateFloorDto<MongoIdType>) {
    const existingFloor = await this.get(floorId);
    const { name, floor, printers } = await validateInput(input, updateFloorRules);
    existingFloor.name = name;
    existingFloor.floor = floor;
    existingFloor.printers = printers;
    return await existingFloor.save();
  }

  async updateName(floorId: MongoIdType, floorName: string) {
    const floor = await this.get(floorId);
    const { name } = await validateInput({ name: floorName }, updateFloorNameRules);
    floor.name = name;
    return await floor.save();
  }

  async updateLevel(floorId: MongoIdType, level: number) {
    const floor = await this.get(floorId);
    const { floor: validLevel } = await validateInput({ floor: level }, updateFloorNumberRules);
    floor.floor = validLevel;
    return await floor.save();
  }

  async deletePrinterFromAnyFloor(printerId: MongoIdType) {
    await Floor.updateMany(
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

  async addOrUpdatePrinter(floorId: MongoIdType, updatedPosition: AddOrUpdatePrinterDto<MongoIdType>) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(updatedPosition, printerInFloorRules(false));

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    // Ensure position is not taken twice
    floor.printers = floor.printers.filter(
      (position: PrinterInFloorDto) => !(position.x === updatedPosition.x && position.y === updatedPosition.y)
    );

    const positionIndex = floor.printers.findIndex(
      (position: PrinterInFloorDto) => position.printerId.toString() === validInput.printerId.toString()
    );
    if (positionIndex !== -1) {
      floor.printers[positionIndex] = validInput;
    } else {
      floor.printers.push(validInput);
    }

    await floor.save();
    return floor;
  }

  async removePrinter(floorId: MongoIdType, printerId: MongoIdType) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput({ printerId }, removePrinterInFloorRules(false));

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
    await this.get(floorId, true);
    await Floor.deleteOne({ _id: floorId });
  }
}
