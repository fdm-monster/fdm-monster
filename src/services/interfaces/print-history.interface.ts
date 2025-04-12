import { IdType } from "@/shared.constants";
import { CreatePrintHistoryDto, PrintHistoryDto } from "@/services/interfaces/print-history.dto";
import { IPrintLog } from "@/models/PrintCompletion";

export interface IPrintHistoryService<KeyType = IdType, Entity = IPrintLog> {
  toDto(printCompletion: Entity): PrintHistoryDto<KeyType>;

  create(input: CreatePrintHistoryDto<KeyType>): Promise<Entity>;

  list(): Promise<Entity[]>;
}
