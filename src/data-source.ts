import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { join } from "path";
import { AppConstants } from "@/server.constants";
import { superRootPath } from "./utils/fs.utils";
import { Init1695584662738 } from "@/migrations/1695584662738-Init";
import { User1695586482740 } from "@/migrations/1695586482740-User";
import { Floor } from "@/entities/floor.entity";
import { FloorPosition } from "@/entities/floor-position.entity";
import { Printer } from "@/entities/printer.entity";
import { Settings } from "@/entities/settings.entity";
import { Permission, PrintCompletion, RefreshToken, User } from "@/entities";
import { CameraStream } from "@/entities/camera-stream.entity";
import { CameraStream1695588105431 } from "@/migrations/1695588105431-CameraStream";
import { CustomGcode } from "@/entities/custom-gcode.entity";
import { CustomGcode1695590022741 } from "@/migrations/1695590022741-CustomGcode";
import { Role } from "@/entities/role.entity";
import { Role1695591973315 } from "@/migrations/1695591973315-Role";
import { PrintCompletionRefreshToken1695672874400 } from "@/migrations/1695672874400-PrintCompletion_RefreshToken";
import { PrinterPrintCompletions1695673511521 } from "@/migrations/1695673511521-PrinterPrintCompletions";
import { FloorRenames1695734057166 } from "@/migrations/1695734057166-FloorRenames";
import { PrinterDateAdded1695741444337 } from "@/migrations/1695741444337-PrinterDateAdded";
import { DateTimeToTimestamp1695743640910 } from "@/migrations/1695743640910-DateTimeToTimestamp";
import { FeedrateStepRate1695845261215 } from "@/migrations/1695845261215-FeedrateStepRate";
import { CameraStreamPrinterId1695921760388 } from "@/migrations/1695921760388-CameraStreamPrinterId";
import { SettingsFileClean1696185514468 } from "@/migrations/1696185514468-SettingsFileClean";
import { PrinterFile } from "@/entities/printer-file.entity";
import { PrinterFile1696188237229 } from "@/migrations/1696188237229-PrinterFile";
import { PrinterFileCleanRename1696688258437 } from "@/migrations/1696688258437-PrinterFileCleanRename";
import { RenameLevelFloorPositionsPrinters1697054722968 } from "@/migrations/1697054722968-RenameLevelFloorPositionsPrinters";
import { RenamePrinterPrinterURL1697271606198 } from "@/migrations/1697271606198-RenamePrinterPrinterURL";
import { CameraName1697272135029 } from "@/migrations/1697272135029-CameraName";

dotenv.config({
  path: join(superRootPath(), ".env"),
});

const dbFolder = process.env[AppConstants.DATABASE_PATH] || "./database";
const dbFile = process.env[AppConstants.DATABASE_FILE] || "./fdm-monster-typeorm.sqlite";
const isMemoryDb = dbFile === ":memory:";
const dbName = isMemoryDb ? dbFile : join(superRootPath(), dbFolder, dbFile);

// Bit verbose
// console.log("Executing config", __filename, "\nDir", __dirname, "\nUsing database:", dbName, "\n");

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: dbName,
  synchronize: false,
  logging: false,
  entities: [
    Floor,
    FloorPosition,
    Printer,
    PrinterFile,
    Settings,
    User,
    CameraStream,
    CustomGcode,
    Role,
    Permission,
    RefreshToken,
    PrintCompletion,
  ],
  migrations: [
    Init1695584662738,
    User1695586482740,
    CameraStream1695588105431,
    CustomGcode1695590022741,
    Role1695591973315,
    PrintCompletionRefreshToken1695672874400,
    PrinterPrintCompletions1695673511521,
    FloorRenames1695734057166,
    PrinterDateAdded1695741444337,
    DateTimeToTimestamp1695743640910,
    FeedrateStepRate1695845261215,
    CameraStreamPrinterId1695921760388,
    SettingsFileClean1696185514468,
    PrinterFile1696188237229,
    PrinterFileCleanRename1696688258437,
    RenameLevelFloorPositionsPrinters1697054722968,
    RenamePrinterPrinterURL1697271606198,
    CameraName1697272135029,
  ],
  subscribers: [],
});
