import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameGroupToTag1767371395741 implements MigrationInterface {
  name = 'RenameGroupToTag1767371395741'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "group"
        RENAME TO "tag"
    `);

    await queryRunner.query(`
      ALTER TABLE "printer_group"
        RENAME TO "printer_tag"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tag"
        RENAME TO "group"
    `);

    await queryRunner.query(`
      ALTER TABLE "printer_tag"
        RENAME TO "printer_group"
    `);
  }
}
