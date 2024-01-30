import { DataSource } from "typeorm";
import { LoggerService } from "@/handlers/logger";
import { AppDataSource } from "@/data-source";

export class TypeormService {
  loaded = false;
  private dataSource?: DataSource;
  private logger = new LoggerService(TypeormService.name);

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
    if (!dataSource.isInitialized) {
      const connection = await dataSource.initialize();
      await connection.runMigrations({ transaction: "all" });
      this.logger.log("Typeorm connection initialized");
    } else {
      this.logger.log("Typeorm connection already initialized, skipping");
    }
    this.loaded = true;
  }

  private loadDataSources() {
    this.dataSource = AppDataSource;
    return this.dataSource!;
  }
}
