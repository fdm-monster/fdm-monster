export class CameraStreamDto {
  id: number;
  name?: string;
  streamURL: string;
  printerId: number | null;
  aspectRatio: string;
  rotationClockwise: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export class CreateCameraStreamDto {
  streamURL: string;
  name: string;
  printerId?: number;
}

export class UpdateCameraStreamDto {
  streamURL: string;
  name: string;
  printerId: number;
}
