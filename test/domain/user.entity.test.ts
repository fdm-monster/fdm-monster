import { User } from "@/entities";
import { AppDataSource } from "@/data-source";
import { ArrayIn } from "@/services/typeorm/operators";

describe(User.name, () => {
  it("should be defined", () => {
    expect(new User()).toBeDefined();
  });

  test.skip("is not able to query roles with ArrayIn", async () => {
    const orm = await AppDataSource.initialize();
    await orm.runMigrations({ transaction: "all" });
    const userRepo = orm.getRepository(User);

    const result = await userRepo.insert({
      username: "test",
      passwordHash: "test",
      roles: [1, 2, 3],
      createdAt: new Date(),
    });

    const userByRoleId = await userRepo.findBy({ roles: ArrayIn([1]) });
    expect(userByRoleId).toBeDefined();
  });
});
