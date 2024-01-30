import { MigrationInterface, QueryRunner } from "typeorm";

export class PrinterFile1696188237229 implements MigrationInterface {
    name = 'PrinterFile1696188237229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text NOT NULL,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text NOT NULL,
                "refs" text NOT NULL,
                "size" integer NOT NULL,
                "statistics" text NOT NULL,
                "type" varchar NOT NULL,
                "typePath" text NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text NOT NULL,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text NOT NULL,
                "refs" text NOT NULL,
                "size" integer NOT NULL,
                "statistics" text NOT NULL,
                "type" varchar NOT NULL,
                "typePath" text NOT NULL,
                CONSTRAINT "FK_66046b90513581dfadc836223a4" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_printer_file"(
                    "id",
                    "printerId",
                    "name",
                    "date",
                    "display",
                    "gcodeAnalysis",
                    "hash",
                    "origin",
                    "path",
                    "prints",
                    "refs",
                    "size",
                    "statistics",
                    "type",
                    "typePath"
                )
            SELECT "id",
                "printerId",
                "name",
                "date",
                "display",
                "gcodeAnalysis",
                "hash",
                "origin",
                "path",
                "prints",
                "refs",
                "size",
                "statistics",
                "type",
                "typePath"
            FROM "printer_file"
        `);
        await queryRunner.query(`
            DROP TABLE "printer_file"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_printer_file"
                RENAME TO "printer_file"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "printer_file"
                RENAME TO "temporary_printer_file"
        `);
        await queryRunner.query(`
            CREATE TABLE "printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text NOT NULL,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text NOT NULL,
                "refs" text NOT NULL,
                "size" integer NOT NULL,
                "statistics" text NOT NULL,
                "type" varchar NOT NULL,
                "typePath" text NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "printer_file"(
                    "id",
                    "printerId",
                    "name",
                    "date",
                    "display",
                    "gcodeAnalysis",
                    "hash",
                    "origin",
                    "path",
                    "prints",
                    "refs",
                    "size",
                    "statistics",
                    "type",
                    "typePath"
                )
            SELECT "id",
                "printerId",
                "name",
                "date",
                "display",
                "gcodeAnalysis",
                "hash",
                "origin",
                "path",
                "prints",
                "refs",
                "size",
                "statistics",
                "type",
                "typePath"
            FROM "temporary_printer_file"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_printer_file"
        `);
        await queryRunner.query(`
            DROP TABLE "printer_file"
        `);
    }

}
