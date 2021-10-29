import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { TestProviders } from "../../../test/base/test.provider";
import { JwtModule } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";
import { JWT_SECRET_KEY } from "../auth.config";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    process.env[JWT_SECRET_KEY] = "asd123";
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...TestProviders,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: () => null
          }
        },
        UsersService,
        AuthService
      ],
      imports: [JwtModule.register({})]
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
