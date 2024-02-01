import { TypeormService } from "@/services/typeorm/typeorm.service";

class OrmMigrationService {
  private typeormService: TypeormService;
  constructor({ typeormService }: { typeormService: TypeormService }) {
    this.typeormService = typeormService;
  }

  async changeToMongoose() {}

  async changeToTypeorm() {}

  async downloadTypeormSqliteBackup() {}

  async downloadMongoBackup() {}

  async syncSqliteToMongo() {}

  async syncMongoToSqlite() {}

  async uploadTypeormSqliteBackup() {}

  async uploadMongoBackup() {}
}
