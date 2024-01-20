import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1695584662738 implements MigrationInterface {
  name = "Init1695584662738";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "printer" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "printerUrl" varchar NOT NULL, "apiKey" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (1), "disabledReason" varchar, "assignee" varchar, "floorPositionId" integer, CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "floor_position" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "posX" integer NOT NULL, "posY" integer NOT NULL, "floorId" integer NOT NULL, "printerId" integer NOT NULL, CONSTRAINT "UQ_bb8c922a67adc84e6073f51304a" UNIQUE ("posX", "posY", "floorId"), CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "floor" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "floorNumber" integer NOT NULL, CONSTRAINT "UQ_fd557a8530545d6b8d9623ee5e5" UNIQUE ("floorNumber"))`
    );
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "server" text NOT NULL, "credentials" text NOT NULL, "wizard" text NOT NULL, "printerFileClean" text NOT NULL, "frontend" text NOT NULL, "timeout" text NOT NULL)`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_printer" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "printerUrl" varchar NOT NULL, "apiKey" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (1), "disabledReason" varchar, "assignee" varchar, "floorPositionId" integer, CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId"), CONSTRAINT "FK_24e875f2c188d19ea80dc9f597c" FOREIGN KEY ("floorPositionId") REFERENCES "floor_position" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_printer"("id", "name", "printerUrl", "apiKey", "enabled", "disabledReason", "assignee", "floorPositionId") SELECT "id", "name", "printerUrl", "apiKey", "enabled", "disabledReason", "assignee", "floorPositionId" FROM "printer"`
    );
    await queryRunner.query(`DROP TABLE "printer"`);
    await queryRunner.query(`ALTER TABLE "temporary_printer" RENAME TO "printer"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_floor_position" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "posX" integer NOT NULL, "posY" integer NOT NULL, "floorId" integer NOT NULL, "printerId" integer NOT NULL, CONSTRAINT "UQ_bb8c922a67adc84e6073f51304a" UNIQUE ("posX", "posY", "floorId"), CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"), CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_floor_position"("id", "posX", "posY", "floorId", "printerId") SELECT "id", "posX", "posY", "floorId", "printerId" FROM "floor_position"`
    );
    await queryRunner.query(`DROP TABLE "floor_position"`);
    await queryRunner.query(`ALTER TABLE "temporary_floor_position" RENAME TO "floor_position"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "floor_position" RENAME TO "temporary_floor_position"`);
    await queryRunner.query(
      `CREATE TABLE "floor_position" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "posX" integer NOT NULL, "posY" integer NOT NULL, "floorId" integer NOT NULL, "printerId" integer NOT NULL, CONSTRAINT "UQ_bb8c922a67adc84e6073f51304a" UNIQUE ("posX", "posY", "floorId"), CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"))`
    );
    await queryRunner.query(
      `INSERT INTO "floor_position"("id", "posX", "posY", "floorId", "printerId") SELECT "id", "posX", "posY", "floorId", "printerId" FROM "temporary_floor_position"`
    );
    await queryRunner.query(`DROP TABLE "temporary_floor_position"`);
    await queryRunner.query(`ALTER TABLE "printer" RENAME TO "temporary_printer"`);
    await queryRunner.query(
      `CREATE TABLE "printer" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "printerUrl" varchar NOT NULL, "apiKey" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (1), "disabledReason" varchar, "assignee" varchar, "floorPositionId" integer, CONSTRAINT "REL_24e875f2c188d19ea80dc9f597" UNIQUE ("floorPositionId"))`
    );
    await queryRunner.query(
      `INSERT INTO "printer"("id", "name", "printerUrl", "apiKey", "enabled", "disabledReason", "assignee", "floorPositionId") SELECT "id", "name", "printerUrl", "apiKey", "enabled", "disabledReason", "assignee", "floorPositionId" FROM "temporary_printer"`
    );
    await queryRunner.query(`DROP TABLE "temporary_printer"`);
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TABLE "floor"`);
    await queryRunner.query(`DROP TABLE "floor_position"`);
    await queryRunner.query(`DROP TABLE "printer"`);
  }
}
