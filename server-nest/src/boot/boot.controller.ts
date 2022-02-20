import { Controller, Get } from "@nestjs/common";
import { Public } from "../utils/auth.decorators";

@Controller()
export class BootController {
  @Get("serverchecks/amialive")
  @Public()
  index() {
    // Need this for normal and fallback mode
    return true;
  }
}
