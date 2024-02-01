import { AppConstants } from "@/server.constants";

process.env[AppConstants.DATABASE_FILE] = ":memory:";

import { AppDataSource } from "@/data-source";
import { Printer } from "@/entities/printer.entity";
import { CustomGcode } from "@/entities";

async function main() {
  console.log("Running test sqlite with TypeORM");

  const ds = await AppDataSource.initialize();

  const printerRepo = ds.getRepository(Printer);
  const entity = printerRepo.create({
    name: "Default Printer",
    printerUrl: "http://localhost:3000",
    apiKey: "1234567890",
  });

  await ds.transaction(async (manager) => {
    const result = await manager.save(entity);
    const printer = await printerRepo.findOneByOrFail({ id: result.id });
    console.log("Printer found", printer.id, printer.name, printer.printerUrl, printer.apiKey);
  });
}

main().then(() => {
  console.log("Done!");

  process.exit(0);
});
