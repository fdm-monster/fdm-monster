import { IdType } from "@/shared.constants";

export class CustomGcodeDto<KeyType = IdType> {
  id: KeyType;
  name: string;
  description?: string;
  gcode: string[];
}
