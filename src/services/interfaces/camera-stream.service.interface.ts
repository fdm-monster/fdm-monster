import { ICameraStream } from "@/models/CameraStream";
import { CameraStreamDto, CreateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { IdType } from "@/shared.constants";
import { CameraStream } from "@/entities";

export interface ICameraStreamService<KeyType = IdType> {
  toDto(entity: CameraStream | ICameraStream): CameraStreamDto<KeyType>;

  list(): Promise<CameraStream[]>;

  get(id: KeyType, throwError?: boolean): Promise<CameraStream | ICameraStream>;

  create(data: CreateCameraStreamDto<IdType>): Promise<CameraStream | ICameraStream>;

  delete(id: KeyType): Promise<void>;

  update(id: KeyType, input: CreateCameraStreamDto<KeyType>): Promise<CameraStream | ICameraStream>;
}
