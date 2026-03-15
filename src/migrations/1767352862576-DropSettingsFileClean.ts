import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSettingsFileClean1767352862576 implements MigrationInterface {
  name = "DropSettingsFileClean1767352862576";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_settings" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "server" text NOT NULL,
                "credentials" text NOT NULL,
                "wizard" text NOT NULL,
                "frontend" text NOT NULL,
                "timeout" text NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_settings"(
                    "id",
                    "server",
                    "credentials",
                    "wizard",
                    "frontend",
                    "timeout"
                )
            SELECT "id",
                "server",
                "credentials",
                "wizard",
                "frontend",
                "timeout"
            FROM "settings"
        `);
    await queryRunner.query(`
            DROP TABLE "settings"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_settings"
                RENAME TO "settings"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "settings"
                RENAME TO "temporary_settings"
        `);
    await queryRunner.query(`
            CREATE TABLE "settings" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "server" text NOT NULL,
                "credentials" text NOT NULL,
                "wizard" text NOT NULL,
                "printerFileClean" text NOT NULL,
                "frontend" text NOT NULL,
                "timeout" text NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "settings"(
                    "id",
                    "server",
                    "credentials",
                    "wizard",
                    "frontend",
                    "timeout"
                )
            SELECT "id",
                "server",
                "credentials",
                "wizard",
                "frontend",
                "timeout"
            FROM "temporary_settings"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_settings"
        `);
  }
}
