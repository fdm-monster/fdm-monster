import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPermissions1766576698569 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE permission
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permission"
      (
        "id"   integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL
      )
    `);
  }

}
