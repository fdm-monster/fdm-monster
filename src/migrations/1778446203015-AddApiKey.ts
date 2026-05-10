import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApiKey1778446203015 implements MigrationInterface {
  name = "AddApiKey1778446203015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_key"
      (
        "id"           integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId"       integer                           NOT NULL,
        "label"        varchar                           NOT NULL,
        "prefix"       varchar                           NOT NULL,
        "hashedSecret" varchar                           NOT NULL,
        "createdAt"    datetime                          NOT NULL DEFAULT (datetime('now')),
        "lastUsedAt"   datetime,
        "revokedAt"    datetime,
        CONSTRAINT "FK_api_key_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_api_key_prefix" ON "api_key" ("prefix")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_api_key_prefix"`);
    await queryRunner.query(`DROP TABLE "api_key"`);
  }
}
