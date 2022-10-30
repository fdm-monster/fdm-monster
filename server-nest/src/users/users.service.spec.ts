import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { TestProviders } from "../../test/base/test.provider";
import { PrismaService } from "@/services/prisma.service";
import createPrismaMock from "prisma-mock";

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(async () => {
    const client = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...TestProviders,
        UsersService,
        {
          provide: PrismaService,
          useValue: client
        }
      ],
      imports: []
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", async () => {
    expect(service).toBeDefined();

    const user = await service.findOne({
      username: "David"
    });
    expect(user).toBeNull();
  });
});
