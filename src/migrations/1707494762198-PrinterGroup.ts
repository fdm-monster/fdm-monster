import { MigrationInterface, QueryRunner } from "typeorm";

export class PrinterGroup1707494762198 implements MigrationInterface {
  name = "PrinterGroup1707494762198";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "group" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "printer_group" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "groupId" integer NOT NULL,
                CONSTRAINT "UQ_c9e2395912075256923415eb2c7" UNIQUE ("printerId", "groupId")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_printer_group" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "groupId" integer NOT NULL,
                CONSTRAINT "UQ_c9e2395912075256923415eb2c7" UNIQUE ("printerId", "groupId"),
                CONSTRAINT "FK_20e241cea3a77568c9372dad6a1" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_789586afe1423a1dfd1104cb7bd" FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_printer_group"("id", "printerId", "groupId")
            SELECT "id",
                "printerId",
                "groupId"
            FROM "printer_group"
        `);
    await queryRunner.query(`
            DROP TABLE "printer_group"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_printer_group"
                RENAME TO "printer_group"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "printer_group"
                RENAME TO "temporary_printer_group"
        `);
    await queryRunner.query(`
            CREATE TABLE "printer_group" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "groupId" integer NOT NULL,
                CONSTRAINT "UQ_c9e2395912075256923415eb2c7" UNIQUE ("printerId", "groupId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "printer_group"("id", "printerId", "groupId")
            SELECT "id",
                "printerId",
                "groupId"
            FROM "temporary_printer_group"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_printer_group"
        `);
    await queryRunner.query(`
            DROP TABLE "printer_group"
        `);
    await queryRunner.query(`
            DROP TABLE "group"
        `);
  }
}
