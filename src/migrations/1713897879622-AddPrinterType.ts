import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrinterType1713897879622 implements MigrationInterface {
    name = 'AddPrinterType1713897879622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_d430b72bf1eaebce7f87068a431" UNIQUE ("name")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_role"("id", "name")
            SELECT "id",
                "name"
            FROM "role"
        `);
        await queryRunner.query(`
            DROP TABLE "role"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_role"
                RENAME TO "role"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_printer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "printerURL" varchar NOT NULL,
                "apiKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (1),
                "disabledReason" varchar,
                "assignee" varchar,
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer,
                "printerType" integer NOT NULL DEFAULT (0)
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_printer"(
                    "id",
                    "name",
                    "printerURL",
                    "apiKey",
                    "enabled",
                    "disabledReason",
                    "assignee",
                    "dateAdded",
                    "feedRate",
                    "flowRate"
                )
            SELECT "id",
                "name",
                "printerURL",
                "apiKey",
                "enabled",
                "disabledReason",
                "assignee",
                "dateAdded",
                "feedRate",
                "flowRate"
            FROM "printer"
        `);
        await queryRunner.query(`
            DROP TABLE "printer"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_printer"
                RENAME TO "printer"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_d430b72bf1eaebce7f87068a431" UNIQUE ("name")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_role"("id", "name")
            SELECT "id",
                "name"
            FROM "role"
        `);
        await queryRunner.query(`
            DROP TABLE "role"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_role"
                RENAME TO "role"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "role"
                RENAME TO "temporary_role"
        `);
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_d430b72bf1eaebce7f87068a431" UNIQUE ("name")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "role"("id", "name")
            SELECT "id",
                "name"
            FROM "temporary_role"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_role"
        `);
        await queryRunner.query(`
            ALTER TABLE "printer"
                RENAME TO "temporary_printer"
        `);
        await queryRunner.query(`
            CREATE TABLE "printer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "printerURL" varchar NOT NULL,
                "apiKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (1),
                "disabledReason" varchar,
                "assignee" varchar,
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer
            )
        `);
        await queryRunner.query(`
            INSERT INTO "printer"(
                    "id",
                    "name",
                    "printerURL",
                    "apiKey",
                    "enabled",
                    "disabledReason",
                    "assignee",
                    "dateAdded",
                    "feedRate",
                    "flowRate"
                )
            SELECT "id",
                "name",
                "printerURL",
                "apiKey",
                "enabled",
                "disabledReason",
                "assignee",
                "dateAdded",
                "feedRate",
                "flowRate"
            FROM "temporary_printer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_printer"
        `);
        await queryRunner.query(`
            ALTER TABLE "role"
                RENAME TO "temporary_role"
        `);
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_d430b72bf1eaebce7f87068a431" UNIQUE ("name")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "role"("id", "name")
            SELECT "id",
                "name"
            FROM "temporary_role"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_role"
        `);
    }

}
