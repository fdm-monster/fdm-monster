import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokenOnDeleteCascade1699090147205 implements MigrationInterface {
  name = "RefreshTokenOnDeleteCascade1699090147205";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_refresh_token"(
                    "id",
                    "userId",
                    "createdAt",
                    "expiresAt",
                    "refreshToken",
                    "refreshAttemptsUsed"
                )
            SELECT "id",
                "userId",
                "createdAt",
                "expiresAt",
                "refreshToken",
                "refreshAttemptsUsed"
            FROM "refresh_token"
        `);
    await queryRunner.query(`
            DROP TABLE "refresh_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_refresh_token"
                RENAME TO "refresh_token"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL,
                CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_refresh_token"(
                    "id",
                    "userId",
                    "createdAt",
                    "expiresAt",
                    "refreshToken",
                    "refreshAttemptsUsed"
                )
            SELECT "id",
                "userId",
                "createdAt",
                "expiresAt",
                "refreshToken",
                "refreshAttemptsUsed"
            FROM "refresh_token"
        `);
    await queryRunner.query(`
            DROP TABLE "refresh_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_refresh_token"
                RENAME TO "refresh_token"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "refresh_token"
                RENAME TO "temporary_refresh_token"
        `);
    await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "refresh_token"(
                    "id",
                    "userId",
                    "createdAt",
                    "expiresAt",
                    "refreshToken",
                    "refreshAttemptsUsed"
                )
            SELECT "id",
                "userId",
                "createdAt",
                "expiresAt",
                "refreshToken",
                "refreshAttemptsUsed"
            FROM "temporary_refresh_token"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_refresh_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "refresh_token"
                RENAME TO "temporary_refresh_token"
        `);
    await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL,
                CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "refresh_token"(
                    "id",
                    "userId",
                    "createdAt",
                    "expiresAt",
                    "refreshToken",
                    "refreshAttemptsUsed"
                )
            SELECT "id",
                "userId",
                "createdAt",
                "expiresAt",
                "refreshToken",
                "refreshAttemptsUsed"
            FROM "temporary_refresh_token"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_refresh_token"
        `);
  }
}
