import "reflect-metadata";
import { DataSource } from "typeorm";
import { getDatabaseFilePath } from "./utils/fs.utils";
import { Floor } from "@/entities/floor.entity";
import { FloorPosition } from "@/entities/floor-position.entity";
import { Printer } from "@/entities/printer.entity";
import { Settings } from "@/entities/settings.entity";
import { PrintJob, RefreshToken, User, PrinterMaintenanceLog } from "@/entities";
import { CameraStream } from "@/entities/camera-stream.entity";
import { Role } from "@/entities/role.entity";
import { UserRole } from "@/entities/user-role.entity";
import { InitSqlite1706829146617 } from "@/migrations/1706829146617-InitSqlite";
import { PrinterTag } from "@/entities/printer-tag.entity";
import { Tag } from "@/entities/tag.entity";
import { PrinterGroup1707494762198 } from "@/migrations/1707494762198-PrinterGroup";
import { ChangePrintCompletionDeletePrinterCascade1708465930665 } from "@/migrations/1708465930665-ChangePrintCompletionDeletePrinterCascade";
import { ChangeRoleNameUnique1713300747465 } from "@/migrations/1713300747465-ChangeRoleNameUnique";
import { RemovePrinterFile1720338804844 } from "@/migrations/1720338804844-RemovePrinterFile";
import { AddPrinterType1713897879622 } from "@/migrations/1713897879622-AddPrinterType";
import { AddPrinterUsernamePassword1745141688926 } from "@/migrations/1745141688926-AddPrinterUsernamePassword";
import { DropPermissions1766576698569 } from "@/migrations/1766576698569-DropPermissions";
import { ChangeCameraPrinterOnDeleteSetNull1767278216516 } from "@/migrations/1767278216516-ChangeCameraPrinterOnDeleteSetNull";
import { DropCustomGcode1767279607392 } from "@/migrations/1767279607392-DropCustomGcode";
import { DropPrintCompletions1767291804417 } from "@/migrations/1767291804417-DropPrintCompletions";
import { DropSettingsFileClean1767352862576 } from "@/migrations/1767352862576-DropSettingsFileClean";
import { ChangeFloorNonUniqueOrder1767370191762 } from "@/migrations/1767370191762-ChangeFloorNonUniqueOrder";
import { RenameGroupToTag1767432108916 } from "@/migrations/1767432108916-RenameGroupToTag";
import { AddPrintJob1767451444137 } from "@/migrations/1767451444137-AddPrintJob";
import { AddPrinterMaintenanceLog1767909428129 } from "@/migrations/1767909428129-AddPrinterMaintenanceLog";

const databaseFilePath = getDatabaseFilePath();

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: databaseFilePath,
  synchronize: false,
  logging: false,
  entities: [
    Floor,
    FloorPosition,
    Printer,
    Settings,
    User,
    CameraStream,
    Role,
    RefreshToken,
    UserRole,
    Tag,
    PrinterTag,
    PrintJob,
    PrinterMaintenanceLog,
  ],
  migrations: [
    InitSqlite1706829146617,
    PrinterGroup1707494762198,
    ChangePrintCompletionDeletePrinterCascade1708465930665,
    ChangeRoleNameUnique1713300747465,
    RemovePrinterFile1720338804844,
    AddPrinterType1713897879622,
    AddPrinterUsernamePassword1745141688926,
    DropPermissions1766576698569,
    ChangeCameraPrinterOnDeleteSetNull1767278216516,
    DropCustomGcode1767279607392,
    DropPrintCompletions1767291804417,
    DropSettingsFileClean1767352862576,
    ChangeFloorNonUniqueOrder1767370191762,
    RenameGroupToTag1767432108916,
    AddPrintJob1767451444137,
    AddPrinterMaintenanceLog1767909428129,
  ],
  subscribers: [],
});
