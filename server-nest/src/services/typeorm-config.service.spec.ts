import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmConfigService } from "@/services/typeorm-config.service";

describe(TypeOrmConfigService.name, () => {
  let service: TypeOrmConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmConfigService]
    }).compile();

    service = module.get<TypeOrmConfigService>(TypeOrmConfigService);
  });

  it("should create connection options in non-PROD mode", async () => {
    const connectionOptions = await service.createTypeOrmOptions("default2");
    expect(connectionOptions).toMatchObject({
      type: "mysql",
      entities: ["dist/**/*.entity{.ts,.js}"],
      subscribers: ["dist/**/*.subscriber{.ts,.js}"],
      migrations: ["dist/**/migrations/*{.ts,.js}"],
      synchronize: false,
      migrationsRun: true,
      extra: {
        charset: "utf8mb4_0900_ai_ci"
      }
    });
  });
});
