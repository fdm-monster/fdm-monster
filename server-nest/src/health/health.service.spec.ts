import { Test, TestingModule } from "@nestjs/testing";
import { HealthService } from "./health.service";
import { DataSource } from "typeorm";

describe(HealthService.name, () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: {
            isInitialized: false,
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
