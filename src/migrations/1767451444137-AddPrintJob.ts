import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrintJob1767451444137 implements MigrationInterface {
    name = 'AddPrintJob1767451444137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "print_job" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer,
                "printerName" varchar,
                "fileName" varchar NOT NULL,
                "fileStorageId" varchar,
                "fileFormat" varchar,
                "fileSize" integer,
                "fileHash" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "analyzedAt" datetime,
                "startedAt" datetime,
                "endedAt" datetime,
                "status" varchar NOT NULL DEFAULT ('PENDING'),
                "analysisState" varchar NOT NULL DEFAULT ('NOT_ANALYZED'),
                "statusReason" varchar,
                "progress" float,
                "metadata" json,
                "statistics" json,
                "queuePosition" integer,
                "queueGroup" varchar
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_print_job" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer,
                "printerName" varchar,
                "fileName" varchar NOT NULL,
                "fileStorageId" varchar,
                "fileFormat" varchar,
                "fileSize" integer,
                "fileHash" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "analyzedAt" datetime,
                "startedAt" datetime,
                "endedAt" datetime,
                "status" varchar NOT NULL DEFAULT ('PENDING'),
                "analysisState" varchar NOT NULL DEFAULT ('NOT_ANALYZED'),
                "statusReason" varchar,
                "progress" float,
                "metadata" json,
                "statistics" json,
                "queuePosition" integer,
                "queueGroup" varchar,
                CONSTRAINT "FK_12483257f75235517688864f2d0" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_print_job"(
                    "id",
                    "printerId",
                    "printerName",
                    "fileName",
                    "fileStorageId",
                    "fileFormat",
                    "fileSize",
                    "fileHash",
                    "createdAt",
                    "updatedAt",
                    "analyzedAt",
                    "startedAt",
                    "endedAt",
                    "status",
                    "analysisState",
                    "statusReason",
                    "progress",
                    "metadata",
                    "statistics",
                    "queuePosition",
                    "queueGroup"
                )
            SELECT "id",
                "printerId",
                "printerName",
                "fileName",
                "fileStorageId",
                "fileFormat",
                "fileSize",
                "fileHash",
                "createdAt",
                "updatedAt",
                "analyzedAt",
                "startedAt",
                "endedAt",
                "status",
                "analysisState",
                "statusReason",
                "progress",
                "metadata",
                "statistics",
                "queuePosition",
                "queueGroup"
            FROM "print_job"
        `);
        await queryRunner.query(`
            DROP TABLE "print_job"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_print_job"
                RENAME TO "print_job"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "print_job"
                RENAME TO "temporary_print_job"
        `);
        await queryRunner.query(`
            CREATE TABLE "print_job" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "printerId" integer,
                "printerName" varchar,
                "fileName" varchar NOT NULL,
                "fileStorageId" varchar,
                "fileFormat" varchar,
                "fileSize" integer,
                "fileHash" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "analyzedAt" datetime,
                "startedAt" datetime,
                "endedAt" datetime,
                "status" varchar NOT NULL DEFAULT ('PENDING'),
                "analysisState" varchar NOT NULL DEFAULT ('NOT_ANALYZED'),
                "statusReason" varchar,
                "progress" float,
                "metadata" json,
                "statistics" json,
                "queuePosition" integer,
                "queueGroup" varchar
            )
        `);
        await queryRunner.query(`
            INSERT INTO "print_job"(
                    "id",
                    "printerId",
                    "printerName",
                    "fileName",
                    "fileStorageId",
                    "fileFormat",
                    "fileSize",
                    "fileHash",
                    "createdAt",
                    "updatedAt",
                    "analyzedAt",
                    "startedAt",
                    "endedAt",
                    "status",
                    "analysisState",
                    "statusReason",
                    "progress",
                    "metadata",
                    "statistics",
                    "queuePosition",
                    "queueGroup"
                )
            SELECT "id",
                "printerId",
                "printerName",
                "fileName",
                "fileStorageId",
                "fileFormat",
                "fileSize",
                "fileHash",
                "createdAt",
                "updatedAt",
                "analyzedAt",
                "startedAt",
                "endedAt",
                "status",
                "analysisState",
                "statusReason",
                "progress",
                "metadata",
                "statistics",
                "queuePosition",
                "queueGroup"
            FROM "temporary_print_job"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_print_job"
        `);
        await queryRunner.query(`
            DROP TABLE "print_job"
        `);
    }

}
