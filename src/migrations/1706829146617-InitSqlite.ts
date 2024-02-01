import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSqlite1706829146617 implements MigrationInterface {
    name = 'InitSqlite1706829146617'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text,
                "refs" text,
                "size" integer,
                "statistics" text,
                "type" varchar,
                "typePath" text,
                "customData" text NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "printer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "printerURL" varchar NOT NULL,
                "apiKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (1),
                "disabledReason" varchar,
                "assignee" varchar,
                "dateAdded" integer NOT NULL DEFAULT (datetime('now')),
                "feedRate" integer,
                "flowRate" integer
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "UQ_bc255adeb42e065d2dbb17029ab" UNIQUE ("x", "y", "floorId"),
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId")
            )
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
            CREATE TABLE "settings" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "server" text NOT NULL,
                "credentials" text NOT NULL,
                "wizard" text NOT NULL,
                "printerFileClean" text NOT NULL,
                "frontend" text NOT NULL,
                "timeout" text NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "roleId" integer NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_7b4e17a669299579dfa55a3fc35" UNIQUE ("roleId", "userId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "isDemoUser" boolean NOT NULL DEFAULT (0),
                "isRootUser" boolean NOT NULL DEFAULT (0),
                "isVerified" boolean NOT NULL DEFAULT (0),
                "needsPasswordChange" boolean NOT NULL DEFAULT (1),
                "passwordHash" varchar NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "permission" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL
            )
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
                CONSTRAINT "REL_565f1b0713258ce710e9fb4827" UNIQUE ("printerId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "custom_gcode" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "gcode" text NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text,
                CONSTRAINT "FK_c078b1dfe5f87f79f131520d856" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "printerReference",
                    "completionLog",
                    "context"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "printerReference",
                "completionLog",
                "context"
            FROM "print_completion"
        `);
        await queryRunner.query(`
            DROP TABLE "print_completion"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_print_completion"
                RENAME TO "print_completion"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text,
                "refs" text,
                "size" integer,
                "statistics" text,
                "type" varchar,
                "typePath" text,
                "customData" text NOT NULL,
                CONSTRAINT "FK_66046b90513581dfadc836223a4" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_printer_file"(
                    "id",
                    "printerId",
                    "name",
                    "date",
                    "display",
                    "gcodeAnalysis",
                    "hash",
                    "origin",
                    "path",
                    "prints",
                    "refs",
                    "size",
                    "statistics",
                    "type",
                    "typePath",
                    "customData"
                )
            SELECT "id",
                "printerId",
                "name",
                "date",
                "display",
                "gcodeAnalysis",
                "hash",
                "origin",
                "path",
                "prints",
                "refs",
                "size",
                "statistics",
                "type",
                "typePath",
                "customData"
            FROM "printer_file"
        `);
        await queryRunner.query(`
            DROP TABLE "printer_file"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_printer_file"
                RENAME TO "printer_file"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_floor_position" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "UQ_bc255adeb42e065d2dbb17029ab" UNIQUE ("x", "y", "floorId"),
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId"),
                CONSTRAINT "FK_5038c7f41e00edb15eca80843b0" FOREIGN KEY ("floorId") REFERENCES "floor" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_2ce10d03d7c8f3d6a30d8e30bb3" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_floor_position"("id", "x", "y", "floorId", "printerId")
            SELECT "id",
                "x",
                "y",
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
            CREATE TABLE "temporary_refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "expiresAt" integer NOT NULL,
                "refreshToken" varchar NOT NULL,
                "refreshAttemptsUsed" integer NOT NULL,
                CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
        await queryRunner.query(`
            CREATE TABLE "temporary_user_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "roleId" integer NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_7b4e17a669299579dfa55a3fc35" UNIQUE ("roleId", "userId"),
                CONSTRAINT "FK_dba55ed826ef26b5b22bd39409b" FOREIGN KEY ("roleId") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ab40a6f0cd7d3ebfcce082131fd" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_user_role"("id", "roleId", "userId", "createdAt")
            SELECT "id",
                "roleId",
                "userId",
                "createdAt"
            FROM "user_role"
        `);
        await queryRunner.query(`
            DROP TABLE "user_role"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_user_role"
                RENAME TO "user_role"
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
                CONSTRAINT "REL_565f1b0713258ce710e9fb4827" UNIQUE ("printerId"),
                CONSTRAINT "FK_565f1b0713258ce710e9fb48273" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                CONSTRAINT "UQ_565f1b0713258ce710e9fb48273" UNIQUE ("printerId"),
                CONSTRAINT "REL_565f1b0713258ce710e9fb4827" UNIQUE ("printerId")
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
            ALTER TABLE "user_role"
                RENAME TO "temporary_user_role"
        `);
        await queryRunner.query(`
            CREATE TABLE "user_role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "roleId" integer NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_7b4e17a669299579dfa55a3fc35" UNIQUE ("roleId", "userId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "user_role"("id", "roleId", "userId", "createdAt")
            SELECT "id",
                "roleId",
                "userId",
                "createdAt"
            FROM "temporary_user_role"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_user_role"
        `);
        await queryRunner.query(`
            ALTER TABLE "refresh_token"
                RENAME TO "temporary_refresh_token"
        `);
        await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
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
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                "floorId" integer NOT NULL,
                "printerId" integer NOT NULL,
                CONSTRAINT "UQ_bc255adeb42e065d2dbb17029ab" UNIQUE ("x", "y", "floorId"),
                CONSTRAINT "REL_2ce10d03d7c8f3d6a30d8e30bb" UNIQUE ("printerId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "floor_position"("id", "x", "y", "floorId", "printerId")
            SELECT "id",
                "x",
                "y",
                "floorId",
                "printerId"
            FROM "temporary_floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_floor_position"
        `);
        await queryRunner.query(`
            ALTER TABLE "printer_file"
                RENAME TO "temporary_printer_file"
        `);
        await queryRunner.query(`
            CREATE TABLE "printer_file" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer NOT NULL,
                "name" varchar NOT NULL,
                "date" integer NOT NULL,
                "display" varchar NOT NULL,
                "gcodeAnalysis" text,
                "hash" varchar NOT NULL,
                "origin" varchar NOT NULL,
                "path" varchar NOT NULL,
                "prints" text,
                "refs" text,
                "size" integer,
                "statistics" text,
                "type" varchar,
                "typePath" text,
                "customData" text NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "printer_file"(
                    "id",
                    "printerId",
                    "name",
                    "date",
                    "display",
                    "gcodeAnalysis",
                    "hash",
                    "origin",
                    "path",
                    "prints",
                    "refs",
                    "size",
                    "statistics",
                    "type",
                    "typePath",
                    "customData"
                )
            SELECT "id",
                "printerId",
                "name",
                "date",
                "display",
                "gcodeAnalysis",
                "hash",
                "origin",
                "path",
                "prints",
                "refs",
                "size",
                "statistics",
                "type",
                "typePath",
                "customData"
            FROM "temporary_printer_file"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_printer_file"
        `);
        await queryRunner.query(`
            ALTER TABLE "print_completion"
                RENAME TO "temporary_print_completion"
        `);
        await queryRunner.query(`
            CREATE TABLE "print_completion" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "fileName" varchar NOT NULL,
                "createdAt" integer NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "printerId" integer NOT NULL,
                "printerReference" varchar,
                "completionLog" varchar,
                "context" text
            )
        `);
        await queryRunner.query(`
            INSERT INTO "print_completion"(
                    "id",
                    "fileName",
                    "createdAt",
                    "status",
                    "printerId",
                    "printerReference",
                    "completionLog",
                    "context"
                )
            SELECT "id",
                "fileName",
                "createdAt",
                "status",
                "printerId",
                "printerReference",
                "completionLog",
                "context"
            FROM "temporary_print_completion"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_print_completion"
        `);
        await queryRunner.query(`
            DROP TABLE "custom_gcode"
        `);
        await queryRunner.query(`
            DROP TABLE "camera_stream"
        `);
        await queryRunner.query(`
            DROP TABLE "permission"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
        await queryRunner.query(`
            DROP TABLE "user_role"
        `);
        await queryRunner.query(`
            DROP TABLE "role"
        `);
        await queryRunner.query(`
            DROP TABLE "refresh_token"
        `);
        await queryRunner.query(`
            DROP TABLE "settings"
        `);
        await queryRunner.query(`
            DROP TABLE "floor"
        `);
        await queryRunner.query(`
            DROP TABLE "floor_position"
        `);
        await queryRunner.query(`
            DROP TABLE "printer"
        `);
        await queryRunner.query(`
            DROP TABLE "printer_file"
        `);
        await queryRunner.query(`
            DROP TABLE "print_completion"
        `);
    }

}
