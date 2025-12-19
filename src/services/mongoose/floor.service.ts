import { Floor, IFloor } from "@/models/Floor";
import { validateInput } from "@/handlers/validators";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import {
  createOrUpdateFloorSchema,
  printerInFloorSchema,
  removePrinterInFloorSchema,
  updateFloorLevelSchema,
  updateFloorNameSchema,
} from "../validators/floor-service.validation";
import { PrinterCache } from "@/state/printer.cache";
import { MongoIdType } from "@/shared.constants";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { CreateFloorDto, FloorDto, PositionDto, UpdateFloorDto } from "@/services/interfaces/floor.dto";
import { IPosition } from "@/models/FloorPrinter";

export class FloorService implements IFloorService<MongoIdType> {
  constructor(private readonly printerCache: PrinterCache) {}

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

  async list() {
    return Floor.find({});
  }

  async get(floorId: MongoIdType) {
    const floor = await Floor.findOne({ _id: floorId });
    if (!floor) {
      throw new NotFoundException(`Floor with provided id does not exist`);
    }

    return floor;
  }

  async createDefaultFloor() {
    return await this.create({
      name: "Default Floor",
      floor: 1,
      printers: [],
    });
  }

  async create(floor: CreateFloorDto<MongoIdType>) {
    const validatedInput = await validateInput(floor, createOrUpdateFloorSchema(false));

    return Floor.create(validatedInput);
  }

  async update(floorId: MongoIdType, update: UpdateFloorDto<MongoIdType>) {
    const existingFloor = await this.get(floorId);

    if (update.printers) {
      for (const position of update.printers) {
        position.floorId = existingFloor.id;
      }
    }

    const floorUpdate = {
      ...existingFloor,
      name: update.name,
      printers: update.printers,
      floor: update.floor,
    };
    const input = await validateInput(floorUpdate, createOrUpdateFloorSchema(false));

    existingFloor.name = input.name;
    existingFloor.floor = input.floor;
    existingFloor.printers = input.printers as PositionDto<MongoIdType>[];
    return await existingFloor.save();
  }

  async updateName(floorId: MongoIdType, floorName: string) {
    const { name } = await validateInput({ name: floorName }, updateFloorNameSchema);

    const floor = await this.get(floorId);
    floor.name = name;
    return await floor.save();
  }

  async updateLevel(floorId: MongoIdType, level: number) {
    const { floor: validLevel } = await validateInput({ floor: level }, updateFloorLevelSchema);

    const floor = await this.get(floorId);
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
      },
    );
  }

  async addOrUpdatePrinter(floorId: MongoIdType, updatedPosition: PositionDto<MongoIdType>) {
    const floor = await this.get(floorId);

    updatedPosition.floorId = floor.id;
    const validInput = await validateInput(updatedPosition, printerInFloorSchema(false));

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    // Ensure position is not taken twice
    floor.printers = floor.printers.filter((position) => !(position.x === validInput.x && position.y === validInput.y));

    const positionIndex = floor.printers.findIndex(
      (position) => position.printerId.toString() === validInput.printerId.toString(),
    );
    if (positionIndex !== -1) {
      floor.printers[positionIndex] = validInput as IPosition;
    } else {
      floor.printers.push(validInput as IPosition);
    }

    await floor.save();
    return floor;
  }

  async removePrinter(floorId: MongoIdType, printerId: MongoIdType) {
    const floor = await this.get(floorId);
    const validInput = await validateInput({ printerId }, removePrinterInFloorSchema(false));

    // Ensure printer exists
    await this.printerCache.getCachedPrinterOrThrowAsync(validInput.printerId);

    const foundPrinterInFloorIndex = floor.printers.findIndex(
      (pif) => pif.printerId.toString() === validInput.printerId.toString(),
    );
    if (foundPrinterInFloorIndex === -1) return floor;
    floor.printers.splice(foundPrinterInFloorIndex, 1);
    await floor.save();
    return floor;
  }

  async delete(floorId: MongoIdType) {
    await this.get(floorId);
    await Floor.deleteOne({ _id: floorId });
  }
}
