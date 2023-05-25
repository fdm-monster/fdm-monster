import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmConfigService } from "@/shared/typeorm-config.service";
import { appOrmConfig } from "../../data-source";

jest.mock("typeorm-extension", () => ({
  createDatabase: () => {},
}));

describe(TypeOrmConfigService.name, () => {
  let service: TypeOrmConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmConfigService],
    }).compile();

    service = module.get<TypeOrmConfigService>(TypeOrmConfigService);
  });

  it("appOrmConfig match known spec", async () => {
    expect(appOrmConfig).toMatchObject({
      type: "postgres",
      entities: ["dist/**/*.entity{.ts,.js}"],
      subscribers: ["dist/**/*.subscriber{.ts,.js}"],
      migrations: ["dist/**/migrations/*{.ts,.js}"],
      synchronize: false,
      // We do this runtime now
      migrationsRun: false,
    });
  });

  it("TypeOrmConfigService should provide options matching spec", async () => {
    expect(await service.createTypeOrmOptions("default3")).toMatchObject({
      type: "postgres",
      entities: ["dist/**/*.entity{.ts,.js}"],
      subscribers: ["dist/**/*.subscriber{.ts,.js}"],
      migrations: ["dist/**/migrations/*{.ts,.js}"],
      synchronize: false,
      migrationsRun: false,
    });
  });
});
