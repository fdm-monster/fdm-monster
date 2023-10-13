import { IdDto } from "@/shared.constants";
import { IsDefined, IsIn, IsNotEmpty, IsOptional } from "class-validator";

export class CameraStreamDto<KeyType> extends IdDto<KeyType> {
  name: string;
  streamURL: string;
  printerId: KeyType;
}

export class CreateCameraStreamDto<KeyType> {
  @IsNotEmpty()
  streamURL: string;
  @IsNotEmpty()
  name: string;
  @IsOptional()
  printerId?: KeyType;
}

export class UpdateCameraStreamDto<KeyType> {
  @IsNotEmpty()
  streamURL: string;
  @IsNotEmpty()
  name: string;
  @IsOptional()
  printerId: KeyType;
}
