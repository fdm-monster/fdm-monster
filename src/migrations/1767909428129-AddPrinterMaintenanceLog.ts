import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrinterMaintenanceLog1767909428129 implements MigrationInterface {
  name = "AddPrinterMaintenanceLog1767909428129";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "printer_maintenance_log"
      (
        "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "createdAt"         datetime                          NOT NULL DEFAULT (datetime('now')),
        "createdBy"         varchar                           NOT NULL,
        "createdByUserId"   integer,
        "printerId"         integer,
        "printerName"       varchar                           NOT NULL,
        "printerUrl"        varchar                           NOT NULL,
        "metadata"          json                              NOT NULL DEFAULT ('{}'),
        "completed"         boolean                           NOT NULL DEFAULT (0),
        "completedAt"       datetime,
        "completedByUserId" integer,
        "completedBy"       varchar,
        CONSTRAINT "FK_d54c05d7dc0cf426afc8175cfdf" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE
          SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_9740e3fd40554a0e40e595ff66d" FOREIGN KEY ("printerId") REFERENCES "printer" ("id") ON DELETE
          SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_36c3aa0f9077a6c06e93e7ec79e" FOREIGN KEY ("completedByUserId") REFERENCES "user" ("id") ON DELETE
          SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_14acf30ae0f34a69d98bf92064" ON "printer_maintenance_log" ("printerId")
        WHERE completed = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_14acf30ae0f34a69d98bf92064"
    `);
    await queryRunner.query(`
      DROP TABLE "printer_maintenance_log"
    `);
  }
}
