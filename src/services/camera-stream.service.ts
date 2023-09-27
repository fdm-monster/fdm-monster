import { CameraStream } from "@/models";
import { validateInput } from "@/handlers/validators";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";

const createCameraStreamRules = {
  printerId: "mongoId",
  streamURL: "required|httpurl",
  settings: "required|object",
  "settings.aspectRatio": ["required", "string", ["in", "16:9", "4:3", "1:1"]],
  "settings.rotationClockwise": "required|integer|in:0,90,180,270",
  "settings.flipHorizontal": "required|boolean",
  "settings.flipVertical": "required|boolean",
};

export class CameraStreamService {
  model = CameraStream;
  printerCache: PrinterCache;

  constructor({ printerCache }: { printerCache: PrinterCache }) {
    this.printerCache = printerCache;
  }

  async list() {
    return this.model.find();
  }

  /**
   * Get a camera stream by id
   * @param id
   * @param throwError
   * @returns {Promise<CameraStream>}
   */
  async get(id, throwError = true) {
    const cameraStream = await this.model.findById(id);
    if (!cameraStream && throwError) {
      throw new NotFoundException(`Floor with id ${id} does not exist.`, "CameraStream");
    }

    return cameraStream;
  }

  async create(data) {
    const input = await validateInput(data, createCameraStreamRules);
    if (input.printerId) {
      await this.printerCache.getCachedPrinterOrThrow(input.printerId);
    }
    return this.model.create(input);
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async update(id, input) {
    await this.get(id);
    const updateInput = await validateInput(input, createCameraStreamRules);
    if (input.printerId) {
      await this.printerCache.getCachedPrinterOrThrow(input.printerId);
    }
    await this.model.updateOne({ id }, updateInput);
    return this.get(id);
  }
}
