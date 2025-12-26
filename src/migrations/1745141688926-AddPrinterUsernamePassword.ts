import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrinterUsernamePassword1745141688926 implements MigrationInterface {
  name = "AddPrinterUsernamePassword1745141688926";

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
                                         "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                                         "feedRate" integer,
                                         "flowRate" integer,
                                         "printerType" integer NOT NULL DEFAULT (0),
                                         "username" varchar DEFAULT (''),
                                         "password" varchar DEFAULT ('')
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
        "flowRate",
        "printerType"
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
             "flowRate",
             "printerType"
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
                                         "apiKey" varchar DEFAULT (''),
                                         "enabled" boolean NOT NULL DEFAULT (1),
                                         "disabledReason" varchar,
                                         "assignee" varchar,
                                         "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                                         "feedRate" integer,
                                         "flowRate" integer,
                                         "printerType" integer NOT NULL DEFAULT (0),
                                         "username" varchar DEFAULT (''),
                                         "password" varchar DEFAULT ('')
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
        "flowRate",
        "printerType",
        "username",
        "password"
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
             "flowRate",
             "printerType",
             "username",
             "password"
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
                               "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                               "feedRate" integer,
                               "flowRate" integer,
                               "printerType" integer NOT NULL DEFAULT (0),
                               "username" varchar DEFAULT (''),
                               "password" varchar DEFAULT ('')
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
        "flowRate",
        "printerType",
        "username",
        "password"
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
             "flowRate",
             "printerType",
             "username",
             "password"
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
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer,
                "printerType" integer NOT NULL DEFAULT (0)
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
                    "flowRate",
                    "printerType"
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
                "flowRate",
                "printerType"
            FROM "temporary_printer"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_printer"
        `);
  }
}
