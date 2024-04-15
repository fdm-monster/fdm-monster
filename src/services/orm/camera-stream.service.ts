import { BaseService } from "@/services/orm/base.service";
import { CameraStream } from "@/entities";
import { CameraStreamDto, CreateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { SqliteIdType } from "@/shared.constants";

export class CameraStreamService
  extends BaseService(CameraStream, CameraStreamDto, CreateCameraStreamDto<SqliteIdType>)
  implements ICameraStreamService<SqliteIdType, CameraStream>
{
  toDto(entity: CameraStream): CameraStreamDto<SqliteIdType> {
    // Maps it to original format
    return {
      id: entity.id,
      streamURL: entity.streamURL,
      name: entity.name,
      printerId: entity.printerId,
      // settings: {
      //   aspectRatio: entity.aspectRatio,
      //   rotationClockwise: entity.rotationClockwise,
      //   flipHorizontal: entity.flipHorizontal,
      //   flipVertical: entity.flipVertical,
      // },
    };
  }
}
