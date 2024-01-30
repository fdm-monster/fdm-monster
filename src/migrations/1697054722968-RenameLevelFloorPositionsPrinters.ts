import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameLevelFloorPositionsPrinters1697054722968 implements MigrationInterface {
    name = 'RenameLevelFloorPositionsPrinters1697054722968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "floor" integer NOT NULL,
                CONSTRAINT "UQ_61b83f63f4e2d1f8c1b331aaf67" UNIQUE ("floor")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor"("id", "name", "floor")
            SELECT "id",
                "name",
                "level"
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
                "level" integer NOT NULL,
                CONSTRAINT "UQ_a99b231bcf8b75cc20bd8ac16a7" UNIQUE ("level")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor"("id", "name", "level")
            SELECT "id",
                "name",
                "floor"
            FROM "temporary_floor"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor"
        `);
    }

}
