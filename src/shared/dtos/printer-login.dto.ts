import { IsAlphanumeric, IsNotEmpty, IsOptional, IsUrl, Length, validateSync } from "class-validator";
import { WsProtocol } from "@/shared/websocket.adapter";
import { apiKeyLengthMinimumDefault } from "@/constants/service.constants";

export class PrinterLoginDto {
  @IsNotEmpty()
  @IsUrl()
  printerURL: string;

  @Length(apiKeyLengthMinimumDefault)
  @IsAlphanumeric()
  @IsNotEmpty()
  apiKey: string;

  @IsOptional()
  context: any = null;

  constructor(printerURL: string, apiKey: string, context: any = null) {
    this.printerURL = printerURL;
    this.apiKey = apiKey;
    this.context = context;
  }

  // This make sure we cant pass interface types - dont remove
  public validateParams() {
    return validateSync(this);
  }

  toSocketLogin(printerId: string, protocol: WsProtocol = "ws"): IPrinterSocketLogin {
    return {
      printerId,
      loginDto: this,
      protocol,
    };
  }
}

export interface IPrinterSocketLogin {
  printerId: string;
  loginDto: PrinterLoginDto;
  protocol?: WsProtocol;
}
