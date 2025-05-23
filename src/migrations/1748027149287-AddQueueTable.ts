import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQueueTable1748027149287 implements MigrationInterface {
    name = 'AddQueueTable1748027149287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "queue" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "orderIndex" integer NOT NULL,
                "filePath" varchar NOT NULL,
                "fileSize" integer NOT NULL,
                "thumbnailBase64" text,
                "printedCount" integer NOT NULL DEFAULT (0),
                "uploadDate" datetime NOT NULL DEFAULT (datetime('now')),
                "totalPrintsRequired" integer NOT NULL DEFAULT (1),
                CONSTRAINT "UQ_91f227b61eb1120ce1c22390583" UNIQUE ("filePath")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "queue"
        `);
    }

}
