import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { TestProviders } from "../../../test/base/test.provider";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { UsersModule } from "../users.module";

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...TestProviders,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: () => null
          }
        },
        UsersService
      ],
      imports: []
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
