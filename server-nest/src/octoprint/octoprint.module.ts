import { Module } from "@nestjs/common";
import { OctoPrintApiService } from "./octoprint-api.service";
import { HttpModule } from "@nestjs/axios";
import { OctoPrintHttpService } from "@/octoprint/octoprint-http.service";
import { OctoPrintConnectionState } from "@/octoprint/octoprint-connection.state";
import { BatchCallService } from "@/octoprint/batch-call.service";

@Module({
  imports: [HttpModule],
  providers: [
    // Custom stateless HttpService that wraps the Axios instance from HttpModule
    OctoPrintHttpService,
    // Stateless client for accessing OctoPrint REST API resources
    OctoPrintApiService,
    OctoPrintConnectionState,
    BatchCallService,
  ],
  exports: [BatchCallService, OctoPrintApiService],
})
export class OctoprintModule {}
