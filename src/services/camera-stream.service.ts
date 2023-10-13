import { CameraStream } from "@/models";
import { validateInput } from "@/handlers/validators";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";
import { MongoIdType } from "@/shared.constants";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { ICameraStream } from "@/models/CameraStream";
import { CameraStreamDto, CreateCameraStreamDto, UpdateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";

// TODO switch to class-validator DTO validation
const createCameraStreamRules = {
  printerId: "mongoId",
  streamURL: "required|httpurl",
  name: "required|string",
};

export class CameraStreamService implements ICameraStreamService<MongoIdType> {
  model = CameraStream;
  printerCache: PrinterCache;

  constructor({ printerCache }: { printerCache: PrinterCache }) {
    this.printerCache = printerCache;
  }

  async list() {
    return this.model.find();
  }

  async get(id: MongoIdType, throwError = true) {
    const cameraStream = await this.model.findById(id);
    if (!cameraStream && throwError) {
      throw new NotFoundException(`Floor with id ${id} does not exist.`, "CameraStream");
    }

    return cameraStream;
  }

  async create(data: CreateCameraStreamDto<MongoIdType>) {
    const input = await validateInput(data, createCameraStreamRules);
    if (input.printerId) {
      await this.printerCache.getCachedPrinterOrThrow(input.printerId);
    }
    return this.model.create(input);
  }

  async delete(id: MongoIdType) {
    return this.model.findByIdAndDelete(id);
  }

  async update(id: MongoIdType, input: UpdateCameraStreamDto<MongoIdType>) {
    await this.get(id);
    const updateInput = await validateInput(input, createCameraStreamRules);
    if (input.printerId) {
      await this.printerCache.getCachedPrinterOrThrow(input.printerId);
    }
    await this.model.updateOne({ id }, updateInput);
    return this.get(id);
  }

  toDto(entity: ICameraStream): CameraStreamDto<MongoIdType> {
    return {
      id: entity.id,
      streamURL: entity.streamURL,
      printerId: entity.printerId === null ? null : entity.printerId?.toString(),
      name: entity.name,
    };
  }
}
