import { IdDto } from "@/shared.constants";

export class PrinterDto extends IdDto {
  name: string;
  disabledReason: string;
  dateAdded: number;
}
