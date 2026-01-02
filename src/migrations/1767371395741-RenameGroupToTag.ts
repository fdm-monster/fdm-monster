import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameGroupToTag1767371395741 implements MigrationInterface {
  name = 'RenameGroupToTag1767371395741'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename group table to tag
    await queryRunner.query(`
      ALTER TABLE "group"
        RENAME TO "tag"
    `);

    // Rename printer_group table to printer_tag and rename groupId column to tagId
    await queryRunner.query(`
      CREATE TABLE "temporary_printer_tag" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "printerId" integer NOT NULL,
        "tagId" integer NOT NULL,
        CONSTRAINT "UQ_c9e2395912075256923415eb2c7" UNIQUE ("printerId", "tagId"),
        CONSTRAINT "FK_20e241cea3a77568c9372dad6a1" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_789586afe1423a1dfd1104cb7bd" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "temporary_printer_tag"("id", "printerId", "tagId")
      SELECT "id", "printerId", "groupId"
      FROM "printer_group"
    `);

    await queryRunner.query(`
      DROP TABLE "printer_group"
    `);

    await queryRunner.query(`
      ALTER TABLE "temporary_printer_tag"
        RENAME TO "printer_tag"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename printer_tag back to printer_group and rename tagId column back to groupId
    await queryRunner.query(`
      ALTER TABLE "printer_tag"
        RENAME TO "temporary_printer_tag"
    `);

    await queryRunner.query(`
      CREATE TABLE "printer_group" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "printerId" integer NOT NULL,
        "groupId" integer NOT NULL,
        CONSTRAINT "UQ_c9e2395912075256923415eb2c7" UNIQUE ("printerId", "groupId"),
        CONSTRAINT "FK_20e241cea3a77568c9372dad6a1" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_789586afe1423a1dfd1104cb7bd" FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "printer_group"("id", "printerId", "groupId")
      SELECT "id", "printerId", "tagId"
      FROM "temporary_printer_tag"
    `);

    await queryRunner.query(`
      DROP TABLE "temporary_printer_tag"
    `);

    // Rename tag table back to group
    await queryRunner.query(`
      ALTER TABLE "tag"
        RENAME TO "group"
    `);
  }
}
