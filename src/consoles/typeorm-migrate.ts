import { DataSource } from "typeorm";
import { PlatformTools } from "typeorm/platform/PlatformTools";
import { CommandUtils } from "typeorm/commands/CommandUtils";
import path from "path";

async function main() {
  let dataSource: DataSource | undefined = undefined;
  try {
    dataSource = await CommandUtils.loadDataSource(path.resolve(process.cwd(), "dist/data-source.js"));
    dataSource.setOptions({
      subscribers: [],
      synchronize: false,
      migrationsRun: false,
      dropSchema: false,
      logging: ["query", "error", "schema"],
    });
    await dataSource.initialize();

    const options = {
      transaction: dataSource.options.migrationsTransactionMode ?? ("all" as "all" | "none" | "each"),
      // fake: !!args.f,
    };
    options.transaction = "all";

    await dataSource.runMigrations(options);
    await dataSource.destroy();
  } catch (err) {
    PlatformTools.logCmdErr("Error during migration run:", err);

    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
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
