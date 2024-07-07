import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePrinterFile1720338804844 implements MigrationInterface {
  name = "RemovePrinterFile1720338804844";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "printer_file"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text,
                "refs" text,
                "size" integer,
                "statistics" text,
                "type" varchar,
                "typePath" text,
                "customData" text NOT NULL,
                CONSTRAINT "FK_66046b90513581dfadc836223a4" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
  }
}
