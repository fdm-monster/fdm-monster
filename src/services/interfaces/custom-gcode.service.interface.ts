import { IdType } from "@/shared.constants";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";
import { CustomGcode } from "@/entities";

export interface ICustomGcodeService<KeyType = IdType, Entity = CustomGcode> {
  toDto(document: Entity): CustomGcodeDto<KeyType>;

  get(gcodeScriptId: KeyType): Promise<Entity>;

  list(): Promise<Entity[]>;

  create(gcodeScript: CustomGcodeDto): Promise<Entity>;

  delete(gcodeScriptId: KeyType): Promise<void>;

  update(gcodeScriptId: KeyType, updatedData: CustomGcodeDto): Promise<Entity>;
}
