import { MigrationInterface, QueryRunner } from "typeorm";

export class DropFloorPositionIdPrinter1703406837191 implements MigrationInterface {
    name = 'DropFloorPositionIdPrinter1703406837191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_printer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "printerURL" varchar NOT NULL,
                "apiKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (1),
                "disabledReason" varchar,
                "assignee" varchar,
                "floorPositionId" integer,
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer,
                CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId")
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
                    "floorPositionId",
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
                "floorPositionId",
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
                "flowRate" integer
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "floorPositionId" integer,
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer,
                CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId")
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
                "floorPositionId" integer,
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer,
                CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId"),
                CONSTRAINT "FK_24e875f2c188d19ea80dc9f597c" FOREIGN KEY ("floorPositionId") REFERENCES "floor_position" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
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
                    "floorPositionId",
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
                "floorPositionId",
                "dateAdded",
                "feedRate",
                "flowRate"
            FROM "temporary_printer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_printer"
        `);
    }

}
