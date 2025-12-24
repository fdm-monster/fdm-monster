import { CameraStreamDto, CreateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { IdType } from "@/shared.constants";
import { CameraStream } from "@/entities";

export interface ICameraStreamService<KeyType = IdType, Entity = CameraStream> {
  toDto(entity: Entity): CameraStreamDto<KeyType>;

  list(): Promise<Entity[]>;

  get(id: KeyType): Promise<Entity>;

  create(data: CreateCameraStreamDto<IdType>): Promise<Entity>;

  delete(id: KeyType): Promise<void>;

  update(id: KeyType, input: CreateCameraStreamDto<KeyType>): Promise<Entity>;
}
