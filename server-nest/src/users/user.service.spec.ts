import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "@/users/entities/user.entity";
import { TestProviders } from "../../test/base/test.provider";

describe("UsersService", () => {
  let service: UserService;

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
      ],
      imports: [],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
