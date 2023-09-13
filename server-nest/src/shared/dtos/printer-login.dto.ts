import { apiKeyLengthMinimumDefault } from "@/printers/printer.constants";
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Length,
  validateSync
} from "class-validator";
import { WsProtocol } from "@/shared/websocket.adapter";

export class PrinterLoginDto {
  @IsNotEmpty()
  @IsUrl()
  printerUrl: string;

  @Length(apiKeyLengthMinimumDefault)
  @IsAlphanumeric()
  @IsNotEmpty()
  apiKey: string;

  @IsOptional()
  context: any = null;

  constructor(printerURL, apiKey, context = null) {
    this.printerUrl = printerURL;
    this.apiKey = apiKey;
    this.context = context;
  }

  // This make sure we cant pass interface types - dont remove
  public validateParams() {
    return validateSync(this);
  }

  toSocketLogin(correlationId: number, protocol: WsProtocol = "ws"): IPrinterSocketLogin {
    return {
      correlationId,
      login: this,
      protocol
    };
  }
}

export interface IPrinterSocketLogin {
  correlationId: number;
  login: PrinterLoginDto;
  protocol?: WsProtocol;
}
