import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFloorLevelToOrder1767355639023 implements MigrationInterface {
  name = "ChangeFloorLevelToOrder1767355639023";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "order" integer NOT NULL,
                CONSTRAINT "UQ_d7b1acf0a04943811027f90a4a4" UNIQUE ("order")
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
    await queryRunner.query(`
            CREATE TABLE "temporary_floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "order" integer NOT NULL,
                CONSTRAINT "UQ_d7b1acf0a04943811027f90a4a4" UNIQUE ("order")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_floor"("id", "name", "order")
            SELECT "id",
                "name",
                "order"
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
    await queryRunner.query(`
            ALTER TABLE "floor"
                RENAME TO "temporary_floor"
        `);
    await queryRunner.query(`
            CREATE TABLE "floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "floor" integer NOT NULL,
                CONSTRAINT "UQ_61b83f63f4e2d1f8c1b331aaf67" UNIQUE ("floor")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "floor"("id", "name", "floor")
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
