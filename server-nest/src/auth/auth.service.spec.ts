import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { TestProviders } from "@/../test/base/test.provider";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "@/users/entities/user.entity";
import { UserService } from "@/users/user.service";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...TestProviders,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: () => null,
          },
        },
        UserService,
        AuthService,
      ],
      imports: [],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
