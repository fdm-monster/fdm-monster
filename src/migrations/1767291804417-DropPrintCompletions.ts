import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPrintCompletions1767291804417 implements MigrationInterface {
  name = "DropPrintCompletions1767291804417";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE print_completion
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "print_completion"
      (
        "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "fileName"         varchar NOT NULL,
        "createdAt"        integer NOT NULL DEFAULT (datetime('now')),
        "status"           varchar NOT NULL,
        "printerId"        integer NOT NULL,
        "printerReference" varchar,
        "completionLog"    varchar,
        "context"          text,
        CONSTRAINT "FK_c078b1dfe5f87f79f131520d856" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE
          SET NULL ON UPDATE NO ACTION
      )
    `);
  }
}
