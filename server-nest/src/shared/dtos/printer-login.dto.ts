import { apiKeyLengthMinimumDefault } from "@/printers/printer.constants";
import { IsAlphanumeric, IsNotEmpty, IsUrl, Length, validateSync } from "class-validator";

export class PrinterLoginDto {
  @IsNotEmpty()
  @IsUrl()
  printerUrl: string;

  @Length(apiKeyLengthMinimumDefault)
  @IsAlphanumeric()
  @IsNotEmpty()
  apiKey: string;

  constructor(printerURL, apiKey) {
    this.printerUrl = printerURL;
    this.apiKey = apiKey;
  }

  // This make sure we cant pass interface types - dont remove
  public validateParams() {
    return validateSync(this);
  }
}
