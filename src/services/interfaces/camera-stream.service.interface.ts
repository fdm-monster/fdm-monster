import { CameraStreamDto, CreateCameraStreamDto } from "@/services/interfaces/camera-stream.dto";
import { CameraStream } from "@/entities";

export interface ICameraStreamService<Entity = CameraStream> {
  toDto(entity: Entity): CameraStreamDto;

  list(): Promise<Entity[]>;

  get(id: number): Promise<Entity>;

  create(data: CreateCameraStreamDto): Promise<Entity>;

  delete(id: number): Promise<void>;

  update(id: number, input: CreateCameraStreamDto): Promise<Entity>;
}
