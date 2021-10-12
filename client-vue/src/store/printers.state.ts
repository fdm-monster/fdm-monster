import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFilesService, PrintersService } from "@/backend";
import { CreatePrinter } from "@/models/printers/crud/create-printer.model";
import { PrinterGroupsService } from "@/backend/printer-groups.service";
import { MultiResponse } from "@/models/api/status-response.model";
import store from "@/store/index";
import { FileUploadCommands } from "@/models/printers/file-upload-commands.model";

@Module({
  dynamic: true,
  store: store,
  name: PrintersModule.name
})
class PrintersModule extends VuexModule {
  printers: Printer[] = [];
  testPrinters?: Printer = undefined;
  printerGroups: PrinterGroup[] = [];
  lastUpdated?: number = undefined;

  selectedPrinters: Printer[] = [];

  get printer() {
    return (printerId: string) => this.printers.find((p: Printer) => p.id === printerId);
  }

  get gridSortedPrinters() {
    return this.printers;
  }

  get printerFiles() {
    return (printerId: string) =>
      this.printers.find((p: Printer) => p.id === printerId)?.fileList.files;
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
    this.printers = printers;
    this.lastUpdated = Date.now();
  }

  @Mutation setPrinterGroups(printerGroups: PrinterGroup[]) {
    this.printerGroups = printerGroups;
    this.lastUpdated = Date.now();
  }

  @Mutation setPrinterFiles({ printerId, files }: { printerId: string; files: PrinterFile[] }) {
    const printer = this.printers.find((p: Printer) => p.id === printerId);

    if (!printer?.fileList) return;

    printer.fileList.files = files;
    printer.fileList.fileCount = files.length;
  }

  @Mutation popPrinterFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
    const printer = this.printers.find((p: Printer) => p.id === printerId);

    if (!printer?.fileList) {
      console.warn("Printer file list was falsy", printerId);
      return;
    }

    const deletedFileIndex = printer.fileList.files.findIndex((f) => f.path === fullPath);

    if (deletedFileIndex !== -1) {
      printer.fileList.files.splice(deletedFileIndex, 1);
      printer.fileList.fileCount = printer.fileList.files.length;
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
  async loadPrinterGroups() {
    const data = await PrinterGroupsService.getGroups();

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
    files: FileList;
    commands?: FileUploadCommands;
  }) {
    const uploadedFiles = [...files].filter((f) => f.name) as File[];

    await PrinterFilesService.uploadFiles(printerId, uploadedFiles, commands);

    console.log("Drop triggered", printerId, files.length, commands);
    // this.setPrinterFiles({ printerId, files: [] });

    return "data";
  }

  @Action
  selectPrinter(printer: Printer) {
    this.toggleSelectedPrinter(printer);
  }

  @Action
  async loadPrinterFiles({ printerId, recursive }: { printerId: string; recursive: boolean }) {
    const data = await PrinterFilesService.getFiles(printerId, recursive);

    this.setPrinterFiles({ printerId, files: data });

    return data;
  }

  @Action
  async deletePrinterFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
    const response = (await PrinterFilesService.deleteFile(printerId, fullPath)) as MultiResponse;

    if (response.cache?.success) {
      this.popPrinterFile({ printerId, fullPath });
    } else {
      console.warn(
        "File was not purged from state as cache.success was false",
        response.cache?.success
      );
    }

    return this.printerFiles(printerId) as PrinterFile[];
  }
}

export const printersState = getModule(PrintersModule, store);
