import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPropertyDefaultsAndIsVerified1697275970026 implements MigrationInterface {
    name = 'UserPropertyDefaultsAndIsVerified1697275970026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL,
                "isRootUser" boolean NOT NULL,
                "needsPasswordChange" boolean NOT NULL,
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL,
                "roles" text NOT NULL,
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
                    "roles"
                )
            SELECT "id",
                "username",
                "isDemoUser",
                "isRootUser",
                "needsPasswordChange",
                "passwordHash",
                "createdAt",
                "roles"
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
            CREATE TABLE "temporary_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL DEFAULT (0),
                "isRootUser" boolean NOT NULL DEFAULT (0),
                "needsPasswordChange" boolean NOT NULL DEFAULT (1),
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL,
                "roles" text NOT NULL,
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
                    "roles",
                    "isVerified"
                )
            SELECT "id",
                "username",
                "isDemoUser",
                "isRootUser",
                "needsPasswordChange",
                "passwordHash",
                "createdAt",
                "roles",
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL,
                "isRootUser" boolean NOT NULL,
                "needsPasswordChange" boolean NOT NULL,
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL,
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
                    "roles",
                    "isVerified"
                )
            SELECT "id",
                "username",
                "isDemoUser",
                "isRootUser",
                "needsPasswordChange",
                "passwordHash",
                "createdAt",
                "roles",
                "isVerified"
            FROM "temporary_user"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL,
                "isRootUser" boolean NOT NULL,
                "needsPasswordChange" boolean NOT NULL,
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL,
                "roles" text NOT NULL
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
                    "roles"
                )
            SELECT "id",
                "username",
                "isDemoUser",
                "isRootUser",
                "needsPasswordChange",
                "passwordHash",
                "createdAt",
                "roles"
            FROM "temporary_user"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `);
    }

}
