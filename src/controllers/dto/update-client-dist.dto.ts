import { AppConstants } from "@/server.constants";

export class UpdateClientDistDto {
  downloadRelease?: string = AppConstants.defaultClientMinimum;

  allowDowngrade?: boolean = false;
}
