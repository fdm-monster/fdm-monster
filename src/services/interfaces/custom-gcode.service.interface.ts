import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";
import { CustomGcode } from "@/entities";

export interface ICustomGcodeService<Entity = CustomGcode> {
  toDto(document: Entity): CustomGcodeDto;

  get(gcodeScriptId: number): Promise<Entity>;

  list(): Promise<Entity[]>;

  create(gcodeScript: CustomGcodeDto): Promise<Entity>;

  delete(gcodeScriptId: number): Promise<void>;

  update(gcodeScriptId: number, updatedData: CustomGcodeDto): Promise<Entity>;
}
