import { DataSource } from "typeorm";
import { LoggerService } from "@/handlers/logger";
import { AppDataSource } from "@/data-source";

export class TypeormService {
  loaded = false;
  private dataSource?: DataSource;
  private readonly logger = new LoggerService(TypeormService.name);

  public hasConnected() {
    if (!this.dataSource) {
      this.loadDataSources();
    }

    return this.dataSource!.isInitialized ? 1 : 0;
  }

  public getDataSource() {
    if (!this.dataSource) {
      this.loadDataSources();
    }

    return this.dataSource!;
  }

  public async createConnection() {
    const dataSource = this.loadDataSources();
    if (dataSource.isInitialized) {
      this.logger.log("Typeorm connection already initialized, skipping");
    } else {
      const connection = await dataSource.initialize();
      const migrations = await connection.runMigrations({ transaction: "all" });
      this.logger.log(`Typeorm connection initialized - ${migrations.length} migrations executed`);
    }
    this.loaded = true;
  }

  private loadDataSources() {
    this.dataSource = AppDataSource;
    return this.dataSource!;
  }
}
