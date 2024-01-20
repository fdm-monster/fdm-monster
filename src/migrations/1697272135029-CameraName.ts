import { MigrationInterface, QueryRunner } from "typeorm";

export class CameraName1697272135029 implements MigrationInterface {
    name = 'CameraName1697272135029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_camera_stream" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "streamURL" varchar NOT NULL,
                "aspectRatio" varchar NOT NULL DEFAULT ('16:9'),
                "rotationClockwise" integer NOT NULL DEFAULT (0),
                "flipHorizontal" boolean NOT NULL DEFAULT (0),
                "flipVertical" boolean NOT NULL DEFAULT (0),
                "printerId" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66aa88973e2775d9e778b31d850" UNIQUE ("printerId"),
                CONSTRAINT "FK_565f1b0713258ce710e9fb48273" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_camera_stream"(
                    "id",
                    "streamURL",
                    "aspectRatio",
                    "rotationClockwise",
                    "flipHorizontal",
                    "flipVertical",
                    "printerId"
                )
            SELECT "id",
                "streamURL",
                "aspectRatio",
                "rotationClockwise",
                "flipHorizontal",
                "flipVertical",
                "printerId"
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
                "aspectRatio" varchar NOT NULL DEFAULT ('16:9'),
                "rotationClockwise" integer NOT NULL DEFAULT (0),
                "flipHorizontal" boolean NOT NULL DEFAULT (0),
                "flipVertical" boolean NOT NULL DEFAULT (0),
                "printerId" integer,
                CONSTRAINT "UQ_66aa88973e2775d9e778b31d850" UNIQUE ("printerId"),
                CONSTRAINT "FK_565f1b0713258ce710e9fb48273" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "camera_stream"(
                    "id",
                    "streamURL",
                    "aspectRatio",
                    "rotationClockwise",
                    "flipHorizontal",
                    "flipVertical",
                    "printerId"
                )
            SELECT "id",
                "streamURL",
                "aspectRatio",
                "rotationClockwise",
                "flipHorizontal",
                "flipVertical",
                "printerId"
            FROM "temporary_camera_stream"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_camera_stream"
        `);
    }

}
