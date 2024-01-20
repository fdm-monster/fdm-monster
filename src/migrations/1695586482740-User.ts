import { MigrationInterface, QueryRunner } from "typeorm";

export class User1695586482740 implements MigrationInterface {
  name = "User1695586482740";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "isDemoUser" boolean NOT NULL, "isRootUser" boolean NOT NULL, "needsPasswordChange" boolean NOT NULL, "passwordHash" varchar NOT NULL, "createdAt" datetime NOT NULL, "roles" text NOT NULL)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
