import { BaseService } from "@/services/orm/base.service";
import { CameraStream } from "@/entities";
import { CameraStreamDto, CreateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";

export class CameraStreamService
  extends BaseService(CameraStream, CameraStreamDto, CreateCameraStreamDto)
  implements ICameraStreamService
{
  toDto(entity: CameraStream): CameraStreamDto {
    // Maps it to original format
    return {
      id: entity.id,
      streamURL: entity.streamURL,
      name: entity.name,
      printerId: entity.printerId,
      aspectRatio: entity.aspectRatio,
      rotationClockwise: entity.rotationClockwise,
      flipHorizontal: entity.flipHorizontal,
      flipVertical: entity.flipVertical,
    };
  }
}
