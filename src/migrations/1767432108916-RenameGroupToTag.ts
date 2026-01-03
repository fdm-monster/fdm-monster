import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameGroupToTag1767432108916 implements MigrationInterface {
  name = 'RenameGroupToTag1767432108916'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tag"
      (
        "id"   integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar                           NOT NULL,
        "color" varchar
      )
    `);
    await queryRunner.query(`
      INSERT INTO "tag"("id", "name")
      SELECT "id",
             "name"
      FROM "group"
    `);
    await queryRunner.dropTable("group");

    // Printer tag table
    await queryRunner.query(`
      CREATE TABLE "printer_tag"
      (
        "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "printerId" integer                           NOT NULL,
        "tagId"     integer                           NOT NULL,
        CONSTRAINT "UQ_639867dded1e0409225feb6d194" UNIQUE ("printerId", "tagId"),
        CONSTRAINT "FK_9be94fa12549808ee97522c7ec0" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_f4a342bd378b98caf8727ab88cb" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "printer_tag"("id", "printerId", "tagId")
      SELECT "id",
             "printerId",
             "groupId"
      FROM "printer_group"
    `);

    await queryRunner.dropTable("printer_group");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate group table first (before printer_group because of foreign key)
    await queryRunner.query(`
      CREATE TABLE "group"
      (
        "id"   integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar                           NOT NULL
      )
    `);
    await queryRunner.query(`
      INSERT INTO "group"("id", "name")
      SELECT "id",
             "name"
      FROM "tag"
    `);
    await queryRunner.dropTable("tag");

    // Recreate printer_group table
    await queryRunner.query(`
      CREATE TABLE "printer_group"
      (
        "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "printerId" integer                           NOT NULL,
        "groupId"   integer                           NOT NULL,
        CONSTRAINT "UQ_639867dded1e0409225feb6d194" UNIQUE ("printerId", "groupId"),
        CONSTRAINT "FK_9be94fa12549808ee97522c7ec0" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_f4a342bd378b98caf8727ab88cb" FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "printer_group"("id", "printerId", "groupId")
      SELECT "id",
             "printerId",
             "tagId"
      FROM "printer_tag"
    `);
    await queryRunner.dropTable("printer_tag");
  }

}
