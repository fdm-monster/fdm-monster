import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCameraPrinterOnDeleteSetNull1767278216516 implements MigrationInterface {
    name = 'ChangeCameraPrinterOnDeleteSetNull1767278216516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_camera_stream" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "streamURL" varchar NOT NULL,
                "name" varchar NOT NULL,
                "printerId" integer,
                "aspectRatio" varchar NOT NULL DEFAULT ('16:9'),
                "rotationClockwise" integer NOT NULL DEFAULT (0),
                "flipHorizontal" boolean NOT NULL DEFAULT (0),
                "flipVertical" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "UQ_565f1b0713258ce710e9fb48273" UNIQUE ("printerId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_camera_stream"(
                    "id",
                    "streamURL",
                    "name",
                    "printerId",
                    "aspectRatio",
                    "rotationClockwise",
                    "flipHorizontal",
                    "flipVertical"
                )
            SELECT "id",
                "streamURL",
                "name",
                "printerId",
                "aspectRatio",
                "rotationClockwise",
                "flipHorizontal",
                "flipVertical"
            FROM "camera_stream"
        `);
        await queryRunner.query(`
            DROP TABLE "camera_stream"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_camera_stream"
                RENAME TO "camera_stream"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_camera_stream" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "streamURL" varchar NOT NULL,
                "name" varchar NOT NULL,
                "printerId" integer,
                "aspectRatio" varchar NOT NULL DEFAULT ('16:9'),
                "rotationClockwise" integer NOT NULL DEFAULT (0),
                "flipHorizontal" boolean NOT NULL DEFAULT (0),
                "flipVertical" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "UQ_565f1b0713258ce710e9fb48273" UNIQUE ("printerId"),
                CONSTRAINT "FK_565f1b0713258ce710e9fb48273" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_camera_stream"(
                    "id",
                    "streamURL",
                    "name",
                    "printerId",
                    "aspectRatio",
                    "rotationClockwise",
                    "flipHorizontal",
                    "flipVertical"
                )
            SELECT "id",
                "streamURL",
                "name",
                "printerId",
                "aspectRatio",
                "rotationClockwise",
                "flipHorizontal",
                "flipVertical"
            FROM "camera_stream"
        `);
        await queryRunner.query(`
            DROP TABLE "camera_stream"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_camera_stream"
                RENAME TO "camera_stream"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "camera_stream"
                RENAME TO "temporary_camera_stream"
        `);
        await queryRunner.query(`
            CREATE TABLE "camera_stream" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "streamURL" varchar NOT NULL,
                "name" varchar NOT NULL,
                "printerId" integer,
                "aspectRatio" varchar NOT NULL DEFAULT ('16:9'),
                "rotationClockwise" integer NOT NULL DEFAULT (0),
                "flipHorizontal" boolean NOT NULL DEFAULT (0),
                "flipVertical" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "UQ_565f1b0713258ce710e9fb48273" UNIQUE ("printerId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "camera_stream"(
                    "id",
                    "streamURL",
                    "name",
                    "printerId",
                    "aspectRatio",
                    "rotationClockwise",
                    "flipHorizontal",
                    "flipVertical"
                )
            SELECT "id",
                "streamURL",
                "name",
                "printerId",
                "aspectRatio",
                "rotationClockwise",
                "flipHorizontal",
                "flipVertical"
            FROM "temporary_camera_stream"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_camera_stream"
        `);
        await queryRunner.query(`
            ALTER TABLE "camera_stream"
                RENAME TO "temporary_camera_stream"
        `);
        await queryRunner.query(`
            CREATE TABLE "camera_stream" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "streamURL" varchar NOT NULL,
                "name" varchar NOT NULL,
                "printerId" integer,
                "aspectRatio" varchar NOT NULL DEFAULT ('16:9'),
                "rotationClockwise" integer NOT NULL DEFAULT (0),
                "flipHorizontal" boolean NOT NULL DEFAULT (0),
                "flipVertical" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "UQ_565f1b0713258ce710e9fb48273" UNIQUE ("printerId"),
                CONSTRAINT "FK_565f1b0713258ce710e9fb48273" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "camera_stream"(
                    "id",
                    "streamURL",
                    "name",
                    "printerId",
                    "aspectRatio",
                    "rotationClockwise",
                    "flipHorizontal",
                    "flipVertical"
                )
            SELECT "id",
                "streamURL",
                "name",
                "printerId",
                "aspectRatio",
                "rotationClockwise",
                "flipHorizontal",
                "flipVertical"
            FROM "temporary_camera_stream"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_camera_stream"
        `);
    }

}
