import { MigrationInterface, QueryRunner } from "typeorm";

export class PrinterDateAdded1695741444337 implements MigrationInterface {
    name = 'PrinterDateAdded1695741444337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_printer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "printerUrl" varchar NOT NULL,
                "apiKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (1),
                "disabledReason" varchar,
                "assignee" varchar,
                "floorPositionId" integer,
                "dateAdded" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId"),
                CONSTRAINT "FK_24e875f2c188d19ea80dc9f597c" FOREIGN KEY ("floorPositionId") REFERENCES "floor_position" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_printer"(
                    "id",
                    "name",
                    "printerUrl",
                    "apiKey",
                    "enabled",
                    "disabledReason",
                    "assignee",
                    "floorPositionId"
                )
            SELECT "id",
                "name",
                "printerUrl",
                "apiKey",
                "enabled",
                "disabledReason",
                "assignee",
                "floorPositionId"
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
                "printerUrl" varchar NOT NULL,
                "apiKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (1),
                "disabledReason" varchar,
                "assignee" varchar,
                "floorPositionId" integer,
                CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId"),
                CONSTRAINT "FK_24e875f2c188d19ea80dc9f597c" FOREIGN KEY ("floorPositionId") REFERENCES "floor_position" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "printer"(
                    "id",
                    "name",
                    "printerUrl",
                    "apiKey",
                    "enabled",
                    "disabledReason",
                    "assignee",
                    "floorPositionId"
                )
            SELECT "id",
                "name",
                "printerUrl",
                "apiKey",
                "enabled",
                "disabledReason",
                "assignee",
                "floorPositionId"
            FROM "temporary_printer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_printer"
        `);
    }

}
