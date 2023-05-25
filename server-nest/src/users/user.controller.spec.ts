import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { CoreTestModule } from "../../test/base/core-test.module";
import { UserRoleService } from "@/users/user-role.service";
import { UserRole } from "@/users/entities/user-role.entity";
import { UserRoleCache } from "@/users/user-role.cache";

describe("UsersController", () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CoreTestModule],
      controllers: [UserController],
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: () => null,
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: () => [],
          },
        },
        UserService,
        UserRoleCache,
        UserRoleService,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
