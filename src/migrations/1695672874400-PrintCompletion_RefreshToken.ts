import { MigrationInterface, QueryRunner } from "typeorm";

export class PrintCompletionRefreshToken1695672874400 implements MigrationInterface {
    name = 'PrintCompletionRefreshToken1695672874400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "posX" integer NOT NULL,
                "posY" integer NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor_position"("id", "posX", "posY", "floorId", "printerId")
            SELECT "id",
                "posX",
                "posY",
                "floorId",
                "printerId"
            FROM "floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_floor_position"
                RENAME TO "floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL,
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "permission" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL,
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "completionLog" varchar,
                "context" text
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor_position"("id", "floorId", "printerId")
            SELECT "id",
                "floorId",
                "printerId"
            FROM "floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_floor_position"
                RENAME TO "floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor_position"("id", "floorId", "printerId")
            SELECT "id",
                "floorId",
                "printerId"
            FROM "floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_floor_position"
                RENAME TO "floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "UQ_bc255adeb42e065d2dbb17029ab" UNIQUE ("x", "y", "floorId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor_position"("id", "floorId", "printerId", "x", "y")
            SELECT "id",
                "floorId",
                "printerId",
                "x",
                "y"
            FROM "floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_floor_position"
                RENAME TO "floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL,
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL,
                CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_refresh_token"(
                    "id",
                    "userId",
                    "createdAt",
                    "expiresAt",
                    "refreshToken",
                    "refreshAttemptsUsed"
                )
            SELECT "id",
                "userId",
                "createdAt",
                "expiresAt",
                "refreshToken",
                "refreshAttemptsUsed"
            FROM "refresh_token"
        `);
        await queryRunner.query(`
            DROP TABLE "refresh_token"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_refresh_token"
                RENAME TO "refresh_token"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "refresh_token"
                RENAME TO "temporary_refresh_token"
        `);
        await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL,
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "refresh_token"(
                    "id",
                    "userId",
                    "createdAt",
                    "expiresAt",
                    "refreshToken",
                    "refreshAttemptsUsed"
                )
            SELECT "id",
                "userId",
                "createdAt",
                "expiresAt",
                "refreshToken",
                "refreshAttemptsUsed"
            FROM "temporary_refresh_token"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_refresh_token"
        `);
        await queryRunner.query(`
            ALTER TABLE "floor_position"
                RENAME TO "temporary_floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor_position"("id", "floorId", "printerId", "x", "y")
            SELECT "id",
                "floorId",
                "printerId",
                "x",
                "y"
            FROM "temporary_floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "floor_position"
                RENAME TO "temporary_floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor_position"("id", "floorId", "printerId")
            SELECT "id",
                "floorId",
                "printerId"
            FROM "temporary_floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "floor_position"
                RENAME TO "temporary_floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "posX" integer NOT NULL,
                "posY" integer NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor_position"("id", "floorId", "printerId")
            SELECT "id",
                "floorId",
                "printerId"
            FROM "temporary_floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "print_completion"
        `);
        await queryRunner.query(`
            DROP TABLE "permission"
        `);
        await queryRunner.query(`
            DROP TABLE "refresh_token"
        `);
        await queryRunner.query(`
            ALTER TABLE "floor_position"
                RENAME TO "temporary_floor_position"
        `);
        await queryRunner.query(`
            CREATE TABLE "floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "posX" integer NOT NULL,
                "posY" integer NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "UQ_bb8c922a67adc84e6073f51304a" UNIQUE ("posX", "posY", "floorId"),
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor_position"("id", "posX", "posY", "floorId", "printerId")
            SELECT "id",
                "posX",
                "posY",
                "floorId",
                "printerId"
            FROM "temporary_floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor_position"
        `);
    }

}
