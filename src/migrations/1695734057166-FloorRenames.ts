import { MigrationInterface, QueryRunner } from "typeorm";

export class FloorRenames1695734057166 implements MigrationInterface {
    name = 'FloorRenames1695734057166'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_floor" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "level" integer NOT NULL,
                CONSTRAINT "UQ_a99b231bcf8b75cc20bd8ac16a7" UNIQUE ("level")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor"("id", "name", "level")
            SELECT "id",
                "name",
                "floorNumber"
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
                "floorNumber" integer NOT NULL,
                CONSTRAINT "UQ_fd557a8530545d6b8d9623ee5e5" UNIQUE ("floorNumber")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor"("id", "name", "floorNumber")
            SELECT "id",
                "name",
                "level"
            FROM "temporary_floor"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor"
        `);
    }

}
