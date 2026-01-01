import { DataSource } from "typeorm";
import { PlatformTools } from "typeorm/platform/PlatformTools";
import { CommandUtils } from "typeorm/commands/CommandUtils";
import path from "node:path";
import chalk from "chalk";
import { camelCase } from "typeorm/util/StringUtils";
import { format } from "@sqltools/formatter/lib/sqlFormatter";
import * as readline from "node:readline";

/**
 * Formats query parameters for migration queries if parameters actually exist
 */
function queryParams(parameters: any[] | undefined): string {
  if (!parameters || !parameters.length) {
    return "";
  }

  return `, ${JSON.stringify(parameters)}`;
}

/**
 * Gets contents of the migration file.
 */
function getTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
  const migrationName = `${camelCase(name, true)}${timestamp}`;

  return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}
`;
}

/**
 * Gets contents of the migration file in Javascript.
 */
function getJavascriptTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
  const migrationName = `${camelCase(name, true)}${timestamp}`;

  return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {
    name = '${migrationName}'

    async up(queryRunner) {
${upSqls.join(`
`)}
    }

    async down(queryRunner) {
${downSqls.join(`
`)}
    }
}
`;
}

/**
 *
 */
function prettifyQuery(query: string) {
  const formattedQuery = format(query, { indent: "    " });
  return "\n" + formattedQuery.replace(/^/gm, "            ") + "\n        ";
}

async function confirm(question: string, hint: string) {
  const line = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    line.question(question, (response) => {
      line.close();
      resolve(response);
    });
    line.write(hint);
  });
}

async function main() {
  const timestamp = CommandUtils.getTimestamp(Date.now());
  const extension = ".ts"; // args.outputJs ? ".js" : ".ts";

  let dataSource: DataSource | undefined = undefined;
  try {
    dataSource = await CommandUtils.loadDataSource(path.resolve(process.cwd(), "dist/data-source.js"));
    dataSource.setOptions({
      synchronize: false,
      migrationsRun: false,
      dropSchema: false,
      logging: false,
    });
    await dataSource.initialize();

    const hasPendingMigrations = await dataSource.showMigrations();
    if (hasPendingMigrations) {
      console.log(
        chalk.yellow(
          `ATTENTION: you have pending migrations (${chalk.blue(
            hasPendingMigrations,
          )}). Running those first, before generating a new migration.`,
        ),
      );

      await dataSource.runMigrations({ transaction: "each" });

      console.log(chalk.green(`Migrations successfully executed.`));
    }

    const upSqls: string[] = [],
      downSqls: string[] = [];

    try {
      const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

      if (true) {
        sqlInMemory.upQueries.forEach((upQuery) => {
          upQuery.query = prettifyQuery(upQuery.query);
        });
        sqlInMemory.downQueries.forEach((downQuery) => {
          downQuery.query = prettifyQuery(downQuery.query);
        });
      }

      sqlInMemory.upQueries.forEach((upQuery) => {
        upSqls.push(
          "        await queryRunner.query(`" +
            upQuery.query.replace(new RegExp("`", "g"), "\\`") +
            "`" +
            queryParams(upQuery.parameters) +
            ");",
        );
      });
      sqlInMemory.downQueries.forEach((downQuery) => {
        downSqls.push(
          "        await queryRunner.query(`" +
            downQuery.query.replace(new RegExp("`", "g"), "\\`") +
            "`" +
            queryParams(downQuery.parameters) +
            ");",
        );
      });
    } finally {
      await dataSource.destroy();
    }

    if (!upSqls.length) {
      console.log(chalk.green(`No changes in database schema were found`));
      process.exit(0);
    }

    console.log(chalk.green(`Migration ready to be saved...`));

    console.log(chalk.blue(upSqls.map((s) => s).join("\n")));

    let name;
    while (!name) {
      name = (await confirm("Please provide a name for the migration: ", "Change"))?.trim();
      if (name) break;
      console.log(chalk.red(`Name is required, try again`));
      process.exit(1);
    }

    const fullPath = path.resolve(process.cwd(), `src/migrations/${name}`);
    const filename = timestamp + "-" + path.basename(fullPath) + extension;

    const fileContent = false
      ? getJavascriptTemplate(path.basename(fullPath), timestamp, upSqls, downSqls.reverse())
      : getTemplate(path.basename(fullPath), timestamp, upSqls, downSqls.reverse());

    const migrationFileName = path.dirname(fullPath) + "/" + filename;
    await CommandUtils.createFile(migrationFileName, fileContent);

    console.log(chalk.green(`Migration ${chalk.blue(migrationFileName)} has been generated successfully.`));
  } catch (err) {
    PlatformTools.logCmdErr("Error during migration generation:", err);
    process.exit(1);
  }
}

let start = new Date().getTime();
main().then(() => {
  let end = new Date().getTime();
  console.log("done", end - start, "ms");

  // exit process if no errors
  process.exit(0);
});
