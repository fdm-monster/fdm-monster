import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePrintCompletionDeletePrinterCascade1708465930665 implements MigrationInterface {
  name = "ChangePrintCompletionDeletePrinterCascade1708465930665";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "printerReference",
                    "completionLog",
                    "context"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "printerReference",
                "completionLog",
                "context"
            FROM "print_completion"
        `);
    await queryRunner.query(`
            DROP TABLE "print_completion"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_print_completion"
                RENAME TO "print_completion"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text,
                CONSTRAINT "FK_c078b1dfe5f87f79f131520d856" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "printerReference",
                    "completionLog",
                    "context"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "printerReference",
                "completionLog",
                "context"
            FROM "print_completion"
        `);
    await queryRunner.query(`
            DROP TABLE "print_completion"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_print_completion"
                RENAME TO "print_completion"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "print_completion"
                RENAME TO "temporary_print_completion"
        `);
    await queryRunner.query(`
            CREATE TABLE "print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text
            )
        `);
    await queryRunner.query(`
            INSERT INTO "print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "printerReference",
                    "completionLog",
                    "context"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "printerReference",
                "completionLog",
                "context"
            FROM "temporary_print_completion"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_print_completion"
        `);
    await queryRunner.query(`
            ALTER TABLE "print_completion"
                RENAME TO "temporary_print_completion"
        `);
    await queryRunner.query(`
            CREATE TABLE "print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text,
                CONSTRAINT "FK_c078b1dfe5f87f79f131520d856" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "printerReference",
                    "completionLog",
                    "context"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "printerReference",
                "completionLog",
                "context"
            FROM "temporary_print_completion"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_print_completion"
        `);
  }
}
