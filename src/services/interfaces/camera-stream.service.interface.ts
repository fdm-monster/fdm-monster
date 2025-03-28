import { ICameraStream } from "@/models/CameraStream";
import { CameraStreamDto, CreateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { IdType } from "@/shared.constants";
import { CameraStream } from "@/entities";

export interface ICameraStreamService<KeyType = IdType, Entity = CameraStream | ICameraStream> {
  toDto(entity: Entity): CameraStreamDto<KeyType>;

  list(): Promise<Entity[]>;

  get(id: KeyType, throwError?: boolean): Promise<Entity>;

  create(data: CreateCameraStreamDto<IdType>): Promise<Entity>;

  delete(id: KeyType, throwError?: boolean): Promise<void>;

  update(id: KeyType, input: CreateCameraStreamDto<KeyType>): Promise<Entity>;
}
