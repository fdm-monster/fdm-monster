import { MigrationInterface, QueryRunner } from "typeorm";

export class PrintCompletion1699089948099 implements MigrationInterface {
  name = "PrintCompletion1699089948099";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "completionLog" varchar,
                "context" text,
                "printerReference" varchar,
                CONSTRAINT "FK_c078b1dfe5f87f79f131520d856" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "completionLog",
                    "context",
                    "printerReference"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "completionLog",
                "context",
                "printerReference"
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
                "createdAt" integer NOT NULL,
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "completionLog" varchar,
                "context" text,
                "printerReference" varchar,
                CONSTRAINT "FK_c078b1dfe5f87f79f131520d856" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "completionLog",
                    "context",
                    "printerReference"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "completionLog",
                "context",
                "printerReference"
            FROM "temporary_print_completion"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_print_completion"
        `);
  }
}
