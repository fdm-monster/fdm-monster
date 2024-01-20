import { MigrationInterface, QueryRunner } from "typeorm";

export class Role1695591973315 implements MigrationInterface {
    name = 'Role1695591973315'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "role"
        `);
    }

}
