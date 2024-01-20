import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRoleConstrained1699176840316 implements MigrationInterface {
    name = 'UserRoleConstrained1699176840316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "roleId" integer NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_7b4e17a669299579dfa55a3fc35" UNIQUE ("roleId", "userId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL DEFAULT (0),
                "isRootUser" boolean NOT NULL DEFAULT (0),
                "needsPasswordChange" boolean NOT NULL DEFAULT (1),
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "isVerified" boolean NOT NULL DEFAULT (0)
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "username",
                    "isDemoUser",
                    "isRootUser",
                    "needsPasswordChange",
                    "passwordHash",
                    "createdAt",
                    "isVerified"
                )
            SELECT "id",
                "username",
                "isDemoUser",
                "isRootUser",
                "needsPasswordChange",
                "passwordHash",
                "createdAt",
                "isVerified"
            FROM "user"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_user"
                RENAME TO "user"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_user_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "roleId" integer NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_7b4e17a669299579dfa55a3fc35" UNIQUE ("roleId", "userId"),
                CONSTRAINT "FK_dba55ed826ef26b5b22bd39409b" FOREIGN KEY ("roleId") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ab40a6f0cd7d3ebfcce082131fd" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_user_role"("id", "roleId", "userId", "createdAt")
            SELECT "id",
                "roleId",
                "userId",
                "createdAt"
            FROM "user_role"
        `);
        await queryRunner.query(`
            DROP TABLE "user_role"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_user_role"
                RENAME TO "user_role"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_role"
                RENAME TO "temporary_user_role"
        `);
        await queryRunner.query(`
            CREATE TABLE "user_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "roleId" integer NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_7b4e17a669299579dfa55a3fc35" UNIQUE ("roleId", "userId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "user_role"("id", "roleId", "userId", "createdAt")
            SELECT "id",
                "roleId",
                "userId",
                "createdAt"
            FROM "temporary_user_role"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_user_role"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL DEFAULT (0),
                "isRootUser" boolean NOT NULL DEFAULT (0),
                "needsPasswordChange" boolean NOT NULL DEFAULT (1),
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "roles" text NOT NULL,
                "isVerified" boolean NOT NULL DEFAULT (0)
            )
        `);
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "username",
                    "isDemoUser",
                    "isRootUser",
                    "needsPasswordChange",
                    "passwordHash",
                    "createdAt",
                    "isVerified"
                )
            SELECT "id",
                "username",
                "isDemoUser",
                "isRootUser",
                "needsPasswordChange",
                "passwordHash",
                "createdAt",
                "isVerified"
            FROM "temporary_user"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `);
        await queryRunner.query(`
            DROP TABLE "user_role"
        `);
    }

}
