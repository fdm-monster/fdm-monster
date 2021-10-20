import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import { PrinterFileService, PrintersService } from "@/backend";
import { CreatePrinter } from "@/models/printers/crud/create-printer.model";
import { PrinterGroupService } from "@/backend/printer-group.service";
import store from "@/store/index";
import { FileUploadCommands } from "@/models/printers/file-upload-commands.model";
import { ClearedFilesResult, PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFileBucket } from "@/models/printers/printer-file-bucket.model";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";
import { PrinterJobService } from "@/backend/printer-job.service";

@Module({
  dynamic: true,
  store: store,
  name: PrintersModule.name
})
class PrintersModule extends VuexModule {
  printers: Printer[] = [];
  testPrinters?: Printer = undefined;
  printerFileBuckets: PrinterFileBucket[] = [];
  printerGroups: PrinterGroup[] = [];
  lastUpdated?: number = undefined;

  sideNavPrinter?: Printer = undefined;
  updateDialogPrinter?: Printer = undefined;
  selectedPrinters: Printer[] = [];

  get currentSideNavPrinter() {
    return this.sideNavPrinter;
  }

  get currentUpdateDialogPrinter() {
    return this.updateDialogPrinter;
  }

  get printer() {
    return (printerId?: string) => this.printers.find((p: Printer) => p.id === printerId);
  }

  get onlinePrinters() {
    return this.printers.filter((p) => p.apiAccessibility.accessible);
  }

  get isSelectedPrinter() {
    return (printerId?: string) => !!this.selectedPrinters.find((p: Printer) => p.id === printerId);
  }

  get isPrinterOperational() {
    return (printerId?: string) => this.printer(printerId)?.printerState?.flags.operational;
  }

  get isPrinterPrinting() {
    return (printerId?: string) => this.printer(printerId)?.printerState?.flags.printing;
  }

  get gridSortedPrinterGroups() {
    if (!this.printerGroups) return () => [];

    return (cols: number, rows: number) => {
      const groupMatrix: any[] = [];

      for (let i = 0; i < cols; i++) {
        groupMatrix[i] = [];
        for (let j = 0; j < rows; j++) {
          groupMatrix[i][j] = this.printerGroups.find(
            (pg) => pg.location.x === i && pg.location.y === j
          );
        }
      }

      return groupMatrix;
    };
  }

  get printerFileBucket() {
    return (printerId?: string) => this.printerFileBuckets.find((p) => p.printerId === printerId);
  }

  get printerFiles() {
    return (printerId?: string) => this.printerFileBucket(printerId)?.files;
  }

  get printerGroupNames() {
    return this.printerGroups.map((pg: PrinterGroup) => pg.name);
  }

  @Mutation addPrinter(printer: Printer) {
    this.printers.push(printer);
    this.printers.sort((a: Printer, b: Printer) => (a.sortIndex > b.sortIndex ? 1 : -1));
  }

  @Mutation setTestPrinter(printer: Printer) {
    this.testPrinters = printer;
    this.lastUpdated = Date.now();
  }

  @Mutation toggleSelectedPrinter(printer: Printer) {
    const selectedPrinterIndex = this.selectedPrinters.findIndex((sp) => sp.id == printer.id);
    if (selectedPrinterIndex === -1) {
      this.selectedPrinters.push(printer);
    } else {
      this.selectedPrinters.splice(selectedPrinterIndex, 1);
    }
  }

  @Mutation resetSelectedPrinters() {
    this.selectedPrinters = [];
  }

  @Mutation _setSideNavPrinter(printer?: Printer) {
    this.sideNavPrinter = printer;
  }

  @Mutation _setUpdateDialogPrinter(printer?: Printer) {
    this.updateDialogPrinter = printer;
  }

  @Mutation replacePrinter({ printerId, printer }: { printerId: string; printer: Printer }) {
    const printerIndex = this.printers.findIndex((p: Printer) => p.id === printerId);

    if (printerIndex !== -1) {
      this.printers[printerIndex] = printer;
    } else {
      console.warn("Printer was not purged as it did not occur in state", printerId);
    }
  }

  @Mutation popPrinter(printerId: string) {
    const printerIndex = this.printers.findIndex((p: Printer) => p.id === printerId);

    if (printerIndex !== -1) {
      this.printers.splice(printerIndex, 1);
    } else {
      console.warn("Printer was not popped as it did not occur in state", printerId);
    }
  }

  @Mutation setPrinters(printers: Printer[]) {
    const viewedPrinterId = this.sideNavPrinter?.id;
    if (viewedPrinterId) {
      this.sideNavPrinter = printers.find((p) => p.id === viewedPrinterId);
    }
    this.printers = printers;
    this.lastUpdated = Date.now();
  }

  @Mutation setPrinterGroups(printerGroups: PrinterGroup[]) {
    this.printerGroups = printerGroups;
    this.lastUpdated = Date.now();
  }

  @Mutation _clearPrinterFiles({
    printerId,
    result
  }: {
    printerId: string;
    result: ClearedFilesResult;
  }) {
    const bucket = this.printerFileBuckets.find((b) => b.printerId === printerId);

    if (bucket) {
      bucket.files = result.failedFiles;
    }
  }

  @Mutation setPrinterFiles({
    printerId,
    fileList
  }: {
    printerId: string;
    fileList: PrinterFileCache;
  }) {
    let fileBucket = this.printerFileBuckets.find((p) => p.printerId === printerId);

    if (!fileBucket) {
      fileBucket = {
        printerId,
        ...fileList
      };
      this.printerFileBuckets.push(fileBucket);
    } else {
      fileBucket.files = fileList.files;
    }
  }

  @Mutation popPrinterFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
    const fileBucket = this.printerFileBuckets.find((p) => p.printerId === printerId);

    if (!fileBucket?.files) {
      console.warn("Printer file list was nonexistent", printerId);
      return;
    }

    const deletedFileIndex = fileBucket.files.findIndex((f) => f.path === fullPath);

    if (deletedFileIndex !== -1) {
      fileBucket.files.splice(deletedFileIndex, 1);
    } else {
      console.warn("File was not purged as it did not occur in state", fullPath);
    }
  }

  @Action
  async createPrinter(newPrinter: CreatePrinter) {
    const data = await PrintersService.createPrinter(newPrinter);

    this.addPrinter(data);

    return data;
  }

  @Action
  async createTestPrinter(newPrinter: CreatePrinter) {
    const data = await PrintersService.testConnection(newPrinter);

    this.setTestPrinter(data);

    return data;
  }

  @Action
  async updatePrinter({
    printerId,
    updatedPrinter
  }: {
    printerId: string;
    updatedPrinter: CreatePrinter;
  }) {
    const data = await PrintersService.updatePrinter(printerId, updatedPrinter);

    this.replacePrinter({ printerId, printer: data });

    return data;
  }

  @Action
  savePrinters(newPrinters: Printer[]) {
    this.setPrinters(newPrinters);

    return newPrinters;
  }

  @Action
  async loadPrinters() {
    const data = await PrintersService.getPrinters();

    this.setPrinters(data);

    return data;
  }

  @Action
  async deletePrinter(printerId: string) {
    const data = await PrintersService.deletePrinter(printerId);

    this.popPrinter(printerId);

    return data;
  }

  @Action
  async savePrinterGroups(printerGroups: PrinterGroup[]) {
    this.setPrinterGroups(printerGroups);

    return printerGroups;
  }

  @Action
  async loadPrinterGroups() {
    const data = await PrinterGroupService.getGroups();

    this.setPrinterGroups(data);

    return data;
  }

  @Action
  async dropUploadPrinterFile({
    printerId,
    files,
    commands
  }: {
    printerId: string;
    files: File[];
    commands?: FileUploadCommands;
  }) {
    if (!printerId) throw new Error("Printer ID was not provided for file upload");

    const uploadedFiles = files.filter((f) => f.name) as File[];

    await PrinterFileService.uploadFiles(printerId, uploadedFiles, commands);

    // TODO update
    // this.setPrinterFiles({ printerId, files: [] });

    return "data";
  }

  @Action
  async sendStopJobCommand(printerId?: string) {
    if (!printerId) return;
    const printer = this.printer(printerId);
    if (!printer) return;

    if (printer.printerState.flags.printing) {
      const answer = confirm("The printer is still printing - are you sure to stop it?");
      if (answer) {
        await PrinterJobService.stopPrintJob(printer.id);
      }
    }
  }

  @Action
  async selectAndPrintFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
    if (!printerId) return;
    const printer = this.printer(printerId);
    if (!printer) return;

    if (printer.printerState.flags.printing || !printer.apiAccessibility.accessible) {
      alert("This printer is printing or not connected! Either way printing is not an option.");
      return;
    }

    await PrinterFileService.selectAndPrintFile(printerId, fullPath);
  }

  @Action
  setSideNavPrinter(printer?: Printer) {
    this._setSideNavPrinter(printer);
  }

  @Action
  setUpdateDialogPrinter(printer?: Printer) {
    this._setUpdateDialogPrinter(printer);
  }

  @Action
  selectPrinter(printer: Printer) {
    this.toggleSelectedPrinter(printer);
  }

  @Action
  clearSelectedPrinters() {
    this.resetSelectedPrinters();
  }

  @Action
  async loadPrinterFiles({ printerId, recursive }: { printerId: string; recursive: boolean }) {
    const data = await PrinterFileService.getFiles(printerId, recursive);

    data.files.sort((f1, f2) => {
      return f1.date > f2.date ? 1 : -1;
    });

    this.setPrinterFiles({ printerId, fileList: data });

    return data;
  }

  @Action
  async clearPrinterFiles(printerId?: string) {
    if (!printerId) return;
    const result = await PrinterFileService.clearFiles(printerId);

    this._clearPrinterFiles({
      printerId,
      result: result as ClearedFilesResult
    });
  }

  @Action
  async deletePrinterFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
    await PrinterFileService.deleteFileOrFolder(printerId, fullPath);

    this.popPrinterFile({ printerId, fullPath });

    return this.printerFiles(printerId) as PrinterFile[];
  }
}

export const printersState = getModule(PrintersModule, store);
