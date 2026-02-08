import { MigrationInterface, QueryRunner } from "typeorm";

export class DropCustomGcode1767279607392 implements MigrationInterface {
  name = "DropCustomGcode1767279607392";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE custom_gcode
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "custom_gcode"
      (
        "id"          integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name"        varchar NOT NULL,
        "description" varchar,
        "gcode"       text    NOT NULL
      )
    `);
  }
}
