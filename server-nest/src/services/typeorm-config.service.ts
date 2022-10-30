import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { AppOrmConfig } from "../../data-source";

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  private logger = new Logger(TypeOrmConfigService.name);

  /**
   * Load, correct and override TypeORM config dynamically
   * @param connectionName
   */
  async createTypeOrmOptions(connectionName?: string): Promise<TypeOrmModuleOptions> {
    const connectionOptions = AppOrmConfig;

    const databaseUrl = connectionOptions.url;
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      this.logger.log(
        `Connecting to database '${connectionOptions.database}' at host '${url.host}'`
      );
    }

    return connectionOptions;
  }
}
