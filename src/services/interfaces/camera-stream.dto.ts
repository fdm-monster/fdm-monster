import { IdDto } from "@/shared.constants";

export class CameraStreamDto<KeyType> extends IdDto<KeyType> {
  name?: string;
  streamURL: string;
  printerId: KeyType | null;
  aspectRatio: string;
  rotationClockwise: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export class CreateCameraStreamDto<KeyType> {
  streamURL: string;
  name: string;
  printerId?: KeyType;
}

export class UpdateCameraStreamDto<KeyType> {
  streamURL: string;
  name: string;
  printerId: KeyType;
}
