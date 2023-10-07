import { IdDto } from "@/shared.constants";

export class PrinterDto<KeyType> extends IdDto<KeyType> {
  name: string;
  disabledReason: string;
  dateAdded: number;
}
