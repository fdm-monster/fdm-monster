import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { appOrmConfig } from "../../data-source";
import { createDatabase } from "typeorm-extension";
import { DataSource, DataSourceOptions, MigrationExecutor } from "typeorm";
import * as os from "os";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  private logger = new Logger(TypeOrmConfigService.name);

  /**
   * Creates the
   * @param options
   */
  static async dataSourceFactory(options: DataSourceOptions) {
    const logger = new Logger(TypeOrmConfigService.name);

    const applicationName = `Server ${os.hostname()}`;
    logger.log(`Finalizing database connection under applicationName '${applicationName}'...`);
    const ds = new DataSource({ ...options, applicationName } as PostgresConnectionOptions);
    await ds.initialize();
    const migrationExecutor = new MigrationExecutor(ds, ds.createQueryRunner("master"));
    const pendingMigrations = await migrationExecutor.getPendingMigrations();
    if (pendingMigrations.length) {
      logger.log(`Running ${pendingMigrations.length} pending migrations on database '${ds.driver.database}'...`);
      migrationExecutor.transaction = "all";
      await migrationExecutor.executePendingMigrations();
    }

    logger.log(`Database '${ds.driver.database}' initialisation successful`);
    return ds;
  }

  /**
   * Load, correct and override TypeORM config dynamically
   * @param connectionName
   */
  async createTypeOrmOptions(connectionName?: string): Promise<TypeOrmModuleOptions> {
    const options = appOrmConfig as DataSourceOptions;

    this.logger.log("Ensuring database is created...");
    await createDatabase({
      options: {
        ...options,
        extra: {
          // Note: essential to suppress logging of library
          logging: false,
        },
      },
      // Crucial, ensures no migrations are run by this tool
      synchronize: false,
      ifNotExist: true,
    });

    return options;
  }
}
