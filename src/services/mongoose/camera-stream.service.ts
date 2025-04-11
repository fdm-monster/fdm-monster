import { CameraStream } from "@/models";
import { validateInput } from "@/handlers/validators";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";
import { MongoIdType } from "@/shared.constants";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { ICameraStream } from "@/models/CameraStream";
import { CameraStreamDto, CreateCameraStreamDto, UpdateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { createCameraStreamSchema } from "../validators/camera-service.validation";

export class CameraStreamService implements ICameraStreamService<MongoIdType> {
  model = CameraStream;

  constructor(private readonly printerCache: PrinterCache) {
  }

  async list() {
    return this.model.find();
  }

  async get(id: MongoIdType) {
    const cameraStream = await this.model.findById(id);
    if (!cameraStream) {
      throw new NotFoundException(`Floor with provided id does not exist`, "CameraStream");
    }

    return cameraStream;
  }

  async create(data: CreateCameraStreamDto<MongoIdType>) {
    const input = await validateInput(data, createCameraStreamSchema(false));
    if (input.printerId) {
      this.printerCache.getCachedPrinterOrThrow(input.printerId);
    }
    return this.model.create(input);
  }

  async delete(id: MongoIdType) {
    await this.get(id);
    await this.model.findByIdAndDelete(id);
  }

  async update(id: MongoIdType, input: UpdateCameraStreamDto<MongoIdType>) {
    await this.get(id);

    const updateInput = await validateInput(input, createCameraStreamSchema(false));
    if (input.printerId) {
      this.printerCache.getCachedPrinterOrThrow(input.printerId);
    }
    await this.model.updateOne({ id }, updateInput);
    return this.get(id);
  }

  toDto(entity: ICameraStream): CameraStreamDto<MongoIdType> {
    return {
      id: entity.id,
      streamURL: entity.streamURL,
      printerId: !entity?.printerId ? null : entity.printerId.toString(),
      name: entity.name,
      aspectRatio: entity.aspectRatio,
      flipHorizontal: entity.flipHorizontal,
      flipVertical: entity.flipVertical,
      rotationClockwise: entity.rotationClockwise
    };
  }
}
