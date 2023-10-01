export class CameraStreamDto<KeyType> {
  id: KeyType;
  streamURL: string;
  printerId: KeyType;
  settings: {
    aspectRatio: string;
    rotationClockwise: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  };
}
