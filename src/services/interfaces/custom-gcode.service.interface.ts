import { IdType } from "@/shared.constants";
import { ICustomGcode } from "@/models/CustomGcode";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";

export interface ICustomGcodeService<KeyType = IdType> {
  toDto(document: ICustomGcode): CustomGcodeDto;

  get(gcodeScriptId: KeyType): Promise<ICustomGcode>;

  list(): Promise<ICustomGcode[]>;

  create(gcodeScript: CustomGcodeDto): Promise<ICustomGcode>;

  delete(gcodeScriptId: KeyType): Promise<ICustomGcode>;

  update(gcodeScriptId: KeyType, updatedData: CustomGcodeDto): Promise<ICustomGcode>;
}
