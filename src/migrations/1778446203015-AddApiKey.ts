import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApiKey1778446203015 implements MigrationInterface {
  name = "AddApiKey1778446203015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_key"
      (
        "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "createdByUserId"   integer                           NOT NULL,
        "label"             varchar                           NOT NULL,
        "prefix"            varchar                           NOT NULL,
        "hashedSecret"      varchar                           NOT NULL,
        "createdAt"         datetime                          NOT NULL DEFAULT (datetime('now')),
        "lastUsedAt"        datetime,
        CONSTRAINT "FK_api_key_created_by_user" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_api_key_prefix" ON "api_key" ("prefix")
    `);
    await queryRunner.query(`
      CREATE TABLE "api_key_role"
      (
        "apiKeyId" integer NOT NULL,
        "roleId"   integer NOT NULL,
        PRIMARY KEY ("apiKeyId", "roleId"),
        CONSTRAINT "FK_api_key_role_api_key" FOREIGN KEY ("apiKeyId") REFERENCES "api_key" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_api_key_role_role"    FOREIGN KEY ("roleId")   REFERENCES "role"    ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_api_key_role_apiKeyId" ON "api_key_role" ("apiKeyId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_api_key_role_roleId" ON "api_key_role" ("roleId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_api_key_role_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_api_key_role_apiKeyId"`);
    await queryRunner.query(`DROP TABLE "api_key_role"`);
    await queryRunner.query(`DROP INDEX "IDX_api_key_prefix"`);
    await queryRunner.query(`DROP TABLE "api_key"`);
  }
}
