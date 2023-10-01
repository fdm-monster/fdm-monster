import { IdDto } from "@/shared.constants";
import { IsDefined, IsIn, IsNotEmpty, IsOptional } from "class-validator";

export class CameraStreamDto<KeyType> extends IdDto<KeyType> {
  streamURL: string;
  printerId: KeyType;
  settings: {
    aspectRatio: string;
    rotationClockwise: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  };
}

export class CameraStreamSettingsDto {
  @IsNotEmpty()
  @IsIn(["16:9", "4:3", "1:1"])
  aspectRatio: string;
  @IsDefined()
  @IsIn([0, 90, 180, 270])
  rotationClockwise: number;
  @IsDefined()
  flipHorizontal: boolean;
  @IsDefined()
  flipVertical: boolean;
}

export class CreateCameraStreamDto<KeyType> {
  @IsNotEmpty()
  streamURL: string;
  @IsOptional()
  printerId: KeyType;
  @IsDefined()
  settings: CameraStreamSettingsDto;
}

export class UpdateCameraStreamDto<KeyType> {
  @IsNotEmpty()
  streamURL: string;
  @IsOptional()
  printerId: KeyType;
  @IsDefined()
  settings: CameraStreamSettingsDto;
}
