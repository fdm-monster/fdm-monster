import { CommandUtils } from "typeorm/commands/CommandUtils";
import path from "node:path";
import chalk from "chalk";
import { camelCase } from "typeorm/util/StringUtils";
import * as readline from "node:readline";
import { PlatformTools } from "typeorm/platform/PlatformTools";

/**
 * Gets contents of the migration file.
 */
function getTemplate(name: string, timestamp: number): string {
  const migrationName = `${camelCase(name, true)}${timestamp}`;

  return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: Add migration queries here
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // TODO: Add rollback queries here
    }

}
`;
}

/**
 * Gets contents of the migration file in Javascript.
 */
function getJavascriptTemplate(name: string, timestamp: number): string {
  const migrationName = `${camelCase(name, true)}${timestamp}`;

  return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {
    name = '${migrationName}'

    async up(queryRunner) {
        // TODO: Add migration queries here
    }

    async down(queryRunner) {
        // TODO: Add rollback queries here
    }
}
`;
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

  try {
    console.log(chalk.green(`Creating empty migration file...`));

    let name;
    while (!name) {
      name = (await confirm("Please provide a name for the migration: ", "NewMigration"))?.trim();
      if (name) break;
      console.log(chalk.red(`Name is required, try again`));
      process.exit(1);
    }

    const fullPath = path.resolve(process.cwd(), `src/migrations/${name}`);
    const filename = timestamp + "-" + path.basename(fullPath) + extension;

    const fileContent = false
      ? getJavascriptTemplate(path.basename(fullPath), timestamp)
      : getTemplate(path.basename(fullPath), timestamp);

    const migrationFileName = path.dirname(fullPath) + "/" + filename;
    await CommandUtils.createFile(migrationFileName, fileContent);

    console.log(chalk.green(`Migration ${chalk.blue(migrationFileName)} has been generated successfully.`));
  } catch (err) {
    PlatformTools.logCmdErr("Error during migration creation:", err);
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

