import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFloorNonUniqueOrder1767370191762 implements MigrationInterface {
  name = "ChangeFloorNonUniqueOrder1767370191762";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "order" integer NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_floor"("id", "name", "order")
            SELECT "id",
                "name",
                "floor"
            FROM "floor"
        `);
    await queryRunner.query(`
            DROP TABLE "floor"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_floor"
                RENAME TO "floor"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "floor"
                RENAME TO "temporary_floor"
        `);
    await queryRunner.query(`
            CREATE TABLE "floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "order" integer NOT NULL,
                CONSTRAINT "UQ_d7b1acf0a04943811027f90a4a4" UNIQUE ("order")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "floor"("id", "name", "order")
            SELECT "id",
                "name",
                "order"
            FROM "temporary_floor"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_floor"
        `);
  }
}
