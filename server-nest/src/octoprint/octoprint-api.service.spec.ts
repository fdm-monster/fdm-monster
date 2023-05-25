import { Test, TestingModule } from "@nestjs/testing";
import { OctoPrintApiService } from "./octoprint-api.service";
import { HttpModule } from "@nestjs/axios";
import { OctoPrintHttpService } from "@/octoprint/octoprint-http.service";
import { CoreTestModule } from "../../test/base/core-test.module";

describe(OctoPrintApiService.name, () => {
  let service: OctoPrintApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OctoPrintApiService, OctoPrintHttpService],
      imports: [HttpModule, CoreTestModule],
    }).compile();

    service = module.get<OctoPrintApiService>(OctoPrintApiService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
