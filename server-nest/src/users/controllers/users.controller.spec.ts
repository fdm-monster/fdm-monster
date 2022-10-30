import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "../users.service";
import { TestProviders } from "../../../test/base/test.provider";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { AuthModule } from "../../auth/auth.module";

describe("UsersController", () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
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

    controller = module.get<UsersController>(UsersController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
