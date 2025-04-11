import { IdType } from "@/shared.constants";
import { ICustomGcode } from "@/models/CustomGcode";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";

export interface ICustomGcodeService<KeyType = IdType, Entity = ICustomGcode> {
  toDto(document: Entity): CustomGcodeDto<KeyType>;

  get(gcodeScriptId: KeyType): Promise<Entity>;

  list(): Promise<Entity[]>;

  create(gcodeScript: CustomGcodeDto): Promise<Entity>;

  delete(gcodeScriptId: KeyType): Promise<void>;

  update(gcodeScriptId: KeyType, updatedData: CustomGcodeDto): Promise<Entity>;
}
