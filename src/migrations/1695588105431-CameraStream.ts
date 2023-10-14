import { MigrationInterface, QueryRunner } from "typeorm";

export class CameraStream1695588105431 implements MigrationInterface {
  name = "CameraStream1695588105431";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "camera_stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "streamURL" varchar NOT NULL, "aspectRatio" varchar NOT NULL DEFAULT ('16:9'), "rotationClockwise" integer NOT NULL DEFAULT (0), "flipHorizontal" boolean NOT NULL DEFAULT (0), "flipVertical" boolean NOT NULL DEFAULT (0))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "camera_stream"`);
  }
}
