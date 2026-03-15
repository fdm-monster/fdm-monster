import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFileRecordTable1773442074582 implements MigrationInterface {
  name = "CreateFileRecordTable1773442074582";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "file_record"
      (
        "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "parentId"  integer,
        "type"      varchar                           NOT NULL,
        "name"      varchar                           NOT NULL,
        "fileGuid"  varchar                           NOT NULL,
        "metadata"  text,
        "createdAt" datetime                          NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime                          NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_file_record_fileGuid" UNIQUE ("fileGuid")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_file_record_fileGuid" ON "file_record" ("fileGuid")
    `);
    await queryRunner.query(`
      INSERT INTO "file_record" ("id", "parentId", "type", "name", "fileGuid", "metadata")
      VALUES (0, 0, 'dir', '/', '00000000-0000-0000-0000-000000000000', NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_file_record_fileGuid"
    `);
    await queryRunner.query(`
      DROP TABLE "file_record"
    `);
  }
}
