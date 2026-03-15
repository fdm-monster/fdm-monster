import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillFileRecords1773529194000 implements MigrationInterface {
  name = "BackfillFileRecords1773529194000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { BackfillFileRecordsTask } = await import("@/tasks/backfill-file-records.task");
    const { configureContainer } = await import("@/container");
    const { DITokens } = await import("@/container.tokens");

    const container = configureContainer();
    const task = container.resolve<BackfillFileRecordsTask>(DITokens.backfillFileRecordsTask);

    const stats = await task.execute({ quiet: false });

    await queryRunner.query(`
      -- BackfillFileRecords Migration Complete
      -- Files scanned: ${stats.filesScanned}
      -- Records created: ${stats.recordsCreated}
      -- Records existing: ${stats.recordsExisting}
      -- Errors: ${stats.errors}
      SELECT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      "BackfillFileRecords migration cannot be reversed. FileRecords created by backfill cannot be distinguished from records created by normal file uploads. Manual cleanup required if needed.",
    );
  }
}
