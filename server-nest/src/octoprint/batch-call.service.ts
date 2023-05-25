import { OctoPrintApiService } from "@/octoprint/octoprint-api.service";
import { forkJoin } from "rxjs";
import { Inject } from "@nestjs/common";
export class BatchCallService {
  constructor(@Inject(OctoPrintApiService) private api: OctoPrintApiService) {}

  private joinNetworkCalls(requests) {
    return forkJoin(requests);
  }
}
