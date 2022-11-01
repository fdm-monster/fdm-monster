import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { Printer } from "@/models/printers/printer.model";
import { PrinterFileService, PrintersService } from "@/backend";
import { CreatePrinter } from "@/models/printers/crud/create-printer.model";
import { PrinterGroupService } from "@/backend/printer-group.service";
import store from "@/store/index";
import { ClearedFilesResult, PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFileBucket } from "@/models/printers/printer-file-bucket.model";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";
import { PrinterJobService } from "@/backend/printer-job.service";
import { CreatePrinterGroup } from "@/models/printer-groups/crud/create-printer-group.model";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { PrinterFloorService } from "@/backend/printer-floor.service";

@Module({
  dynamic: true,
  store: store,
  name: PrintersModule.name,
})
class PrintersModule extends VuexModule {
  printers: Printer[] = [];
  testPrinters?: Printer = undefined;
  printerFileBuckets: PrinterFileBucket[] = [];
  printerGroups: PrinterGroup[] = [];
  floors: PrinterFloor[] = [];
  selectedFloor?: PrinterFloor = undefined;
  lastUpdated?: number = undefined;

  sideNavPrinter?: Printer = undefined;
  updateDialogPrinter?: Printer = undefined;
  createDialogOpened?: boolean = false;
  createGroupDialogOpened?: boolean = false;
  updateDialogPrinterGroup?: PrinterGroup = undefined;
  createFloorDialogOpened?: boolean = false;
  selectedPrinters: Printer[] = [];

  readonly horizontalOffset = 1;

  get selectedPrinterFloor() {
    return this.selectedFloor;
  }

  get printerFloors() {
    return this.floors.sort((f, f2) => f.floor - f2.floor);
  }

  get currentSideNavPrinter() {
    return this.sideNavPrinter;
  }

  get currentUpdateDialogPrinter() {
    return this.updateDialogPrinter;
  }

  get currentUpdateDialogPrinterGroup() {
    return this.updateDialogPrinterGroup;
  }

  get printerGroup() {
    return (groupId: string) => this.printerGroups.find((pg) => pg._id === groupId);
  }

  get printerFloor() {
    return (floorId: string) => this.floors.find((pf) => pf._id === floorId);
  }

  get printer() {
    return (printerId?: string) => this.printers.find((p) => p.id === printerId);
  }

  get floorOfGroup() {
    return (printerGroupId: string) =>
      this.printerFloors.find((pg) =>
        pg.printerGroups.map((pid) => pid.printerGroupId).includes(printerGroupId)
      );
  }

  get groupOfPrinter() {
    return (printerId: string) =>
      this.printerGroups.find((pg) => pg.printers.map((pid) => pid.printerId).includes(printerId));
  }

  get onlinePrinters() {
    return this.printers.filter((p) => p.apiAccessibility.accessible);
  }

  get isSelectedPrinter() {
    return (printerId?: string) => !!this.selectedPrinters.find((p: Printer) => p.id === printerId);
  }

  get isPrinterOperational() {
    return (printerId?: string) => this.printer(printerId)?.printerState?.flags?.operational;
  }

  get isPrinterPrinting() {
    return (printerId?: string) => this.printer(printerId)?.printerState?.flags?.printing;
  }

  get ungroupedPrinters() {
    return this.printers.filter(
      (p) => !this.printerGroups.find((g) => g.printers.find((pgp) => pgp.printerId === p.id))
    );
  }

  get floorlessGroups() {
    return this.printerGroups.filter(
      (p) => !this.floors.find((g) => g.printerGroups.find((pgp) => pgp.printerGroupId === p._id))
    );
  }

  get printersWithJob(): Printer[] {
    return this.printers.filter(
      // If flags are falsy, we can skip the printer => its still connecting
      (p) =>
        p.printerState.flags && (p.printerState.flags.printing || p.printerState.flags.printing)
    );
  }

  get gridSortedPrinterGroups() {
    if (!this.printerGroups) return () => [];

    // TODO loader
    if (!this.selectedPrinterFloor) return () => [];

    const relevantPrinterGroupIds = this.selectedPrinterFloor.printerGroups.map(
      (spfg) => spfg.printerGroupId
    );
    const relevantGroups = this.printerGroups.filter((pg) =>
      relevantPrinterGroupIds.includes(pg._id!)
    );

    return (cols: number, rows: number) => {
      const groupMatrix: any[] = [];

      for (let i = 0; i < cols; i++) {
        groupMatrix[i] = [];
        for (let j = 0; j < rows; j++) {
          groupMatrix[i][j] = relevantGroups.find(
            (pg) => pg.location.x + this.horizontalOffset === i && pg.location.y === j
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
      if (printer.apiAccessibility.accessible) {
        this.selectedPrinters.push(printer);
      }
    } else {
      this.selectedPrinters.splice(selectedPrinterIndex, 1);
    }
  }

  @Mutation addPrinterGroup(printerGroup: PrinterGroup) {
    // No need to sort as `gridSortedPrinterGroups` will fix this on the go
    this.printerGroups.push(printerGroup);
  }

  @Mutation addPrinterFloor(printerFloor: PrinterFloor) {
    this.floors.push(printerFloor);
  }

  @Mutation _setSelectedPrinterFloor(floor: PrinterFloor) {
    this.selectedFloor = floor;
  }

  @Mutation _setPrinterFloors(floors: PrinterFloor[]) {
    this.floors = floors;
    if (!this.selectedFloor) {
      this.selectedFloor = floors[0];
    }
  }

  @Mutation _resetSelectedPrinters() {
    this.selectedPrinters = [];
  }

  @Mutation _setSideNavPrinter(printer?: Printer) {
    this.sideNavPrinter = printer;
  }

  @Mutation _setUpdateDialogPrinter(printer?: Printer) {
    this.updateDialogPrinter = printer;
  }

  @Mutation _setUpdateDialogPrinterGroup(printerGroup?: PrinterGroup) {
    this.updateDialogPrinterGroup = printerGroup;
  }

  @Mutation _setCreateDialogOpened(opened: boolean) {
    this.createDialogOpened = opened;
  }

  @Mutation _setCreateGroupDialogOpened(opened: boolean) {
    this.createGroupDialogOpened = opened;
  }

  @Mutation _setCreateFloorDialogOpened(opened: boolean) {
    this.createFloorDialogOpened = opened;
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
    const sortedPrinterGroups = printerGroups.sort((g1, g2) => {
      const l1 = g1.location;
      const l2 = g2.location;
      if (l1.x < l2.x) return -1;
      if (l1.x > l2.x) return 1;
      if (l1.x === l2.x) {
        if (l1.y < l2.y) return -1;
        if (l1.y > l2.y) return 1;
        return g1.name.localeCompare(g2.name) ? -1 : 1;
      }

      // Silence TS
      return 1;
    });

    sortedPrinterGroups.forEach((pg) =>
      pg.printers.sort((p1, p2) => p1.location.localeCompare(p2.location))
    );
    this.printerGroups = sortedPrinterGroups;
    this.lastUpdated = Date.now();
  }

  @Mutation replacePrinterGroup(printerGroup: PrinterGroup) {
    const foundGroupIndex = this.printerGroups.findIndex((pg) => pg._id === printerGroup._id);
    if (foundGroupIndex !== -1) {
      this.printerGroups[foundGroupIndex] = printerGroup;
      this.lastUpdated = Date.now();
    }
  }

  @Mutation popPrinterGroup(groupId: string) {
    const foundGroupIndex = this.printerGroups.findIndex((pg) => pg._id === groupId);
    if (foundGroupIndex !== -1) {
      this.printerGroups.splice(foundGroupIndex, 1);
    }
  }

  @Mutation popPrinterFloor(floorId: string) {
    const foundFloorIndex = this.floors.findIndex((pg) => pg._id === floorId);
    if (foundFloorIndex !== -1) {
      this.floors.splice(foundFloorIndex, 1);
    }
  }

  @Mutation replacePrinterFloor(printerFloor: PrinterFloor) {
    const foundFloorIndex = this.floors.findIndex((pf) => pf._id === printerFloor._id);
    if (foundFloorIndex !== -1) {
      this.floors[foundFloorIndex] = printerFloor;
      this.lastUpdated = Date.now();
    }
  }

  @Mutation _clearPrinterFiles({
    printerId,
    result,
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
    fileList,
  }: {
    printerId: string;
    fileList: PrinterFileCache;
  }) {
    let fileBucket = this.printerFileBuckets.find((p) => p.printerId === printerId);

    if (!fileBucket) {
      fileBucket = {
        printerId,
        ...fileList,
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
    updatedPrinter,
  }: {
    printerId: string;
    updatedPrinter: CreatePrinter;
  }) {
    const data = await PrintersService.updatePrinter(printerId, updatedPrinter);

    this.replacePrinter({ printerId, printer: data });

    return data;
  }

  @Action
  async updatePrinterGroup({
    printerGroupId,
    updatePrinterGroup,
  }: {
    printerGroupId: string;
    updatePrinterGroup: CreatePrinterGroup;
  }) {
    const data = await PrinterGroupService.updateGroup(printerGroupId, updatePrinterGroup);
    this.replacePrinterGroup(data);
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
  async createPrinterGroup(newPrinterGroup: CreatePrinterGroup) {
    const data = await PrinterGroupService.createGroup(newPrinterGroup);

    this.addPrinterGroup(data);

    return data;
  }

  @Action
  async createPrinterFloor(newPrinterFloor: PrinterFloor) {
    const data = await PrinterFloorService.createFloor(newPrinterFloor);

    this.addPrinterFloor(data);

    return data;
  }

  @Action
  async savePrinterGroups(printerGroups: PrinterGroup[]) {
    this.setPrinterGroups(printerGroups);

    return printerGroups;
  }

  @Action
  async loadPrinterGroups() {
    if (this.selectedFloor) {
      // ok
    } else {
      // Gotta figure something out to still show printers
    }

    const data = await PrinterGroupService.getGroups();

    this.setPrinterGroups(data);

    return data;
  }

  @Action
  savePrinterFloors(floors: PrinterFloor[]) {
    this._setPrinterFloors(floors);

    return floors;
  }

  @Action
  async changeSelectedFloorByIndex(selectedPrinterFloorIndex: number) {
    if (!this.floors?.length) return;
    if (this.floors.length <= selectedPrinterFloorIndex) return;

    // SSE will sync result
    const newFloor = this.floors[selectedPrinterFloorIndex];
    if (!newFloor) return;

    this._setSelectedPrinterFloor(newFloor);

    return newFloor;
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
  setUpdateDialogPrinterGroup(printerGroup?: PrinterGroup) {
    this._setUpdateDialogPrinterGroup(printerGroup);
  }

  @Action
  setCreateDialogOpened(opened: boolean) {
    this._setCreateDialogOpened(opened);
  }

  @Action
  setCreateGroupDialogOpened(opened: boolean) {
    this._setCreateGroupDialogOpened(opened);
  }

  @Action
  setCreateFloorDialogOpened(opened: boolean) {
    this._setCreateFloorDialogOpened(opened);
  }

  @Action
  selectPrinter(printer: Printer) {
    this.toggleSelectedPrinter(printer);
  }

  @Action
  clearSelectedPrinters() {
    this._resetSelectedPrinters();
  }

  @Action
  async loadPrinterFiles({ printerId, recursive }: { printerId: string; recursive: boolean }) {
    const data = await PrinterFileService.getFiles(printerId, recursive);

    data.files.sort((f1, f2) => {
      return f1.date < f2.date ? 1 : -1;
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
      result: result as ClearedFilesResult,
    });
  }

  @Action
  async deletePrinterFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
    await PrinterFileService.deleteFileOrFolder(printerId, fullPath);

    this.popPrinterFile({ printerId, fullPath });

    return this.printerFiles(printerId) as PrinterFile[];
  }

  @Action
  async updatePrinterGroupName({ groupId, name }: { groupId: string; name: string }) {
    const group = await PrinterGroupService.updateGroupName(groupId, name);

    this.replacePrinterGroup(group);

    return group;
  }

  @Action
  async updatePrinterFloorName({ floorId, name }: { floorId: string; name: string }) {
    const floor = await PrinterFloorService.updateFloorName(floorId, name);

    this.replacePrinterFloor(floor);

    return floor;
  }

  @Action
  async updatePrinterFloorNumber({
    floorId,
    floorNumber,
  }: {
    floorId: string;
    floorNumber: number;
  }) {
    const floor = await PrinterFloorService.updateFloorNumber(floorId, floorNumber);

    this.replacePrinterFloor(floor);

    return floor;
  }

  @Action
  async deletePrinterGroup(groupId: string) {
    await PrinterGroupService.deleteGroup(groupId);

    this.popPrinterGroup(groupId);
  }

  @Action
  async deletePrinterFloor(floorId: string) {
    await PrinterFloorService.deleteFloor(floorId);

    this.popPrinterFloor(floorId);
  }

  @Action
  async addPrinterToGroup({
    groupId,
    printerId,
    location,
  }: {
    groupId: string;
    printerId: string;
    location: string;
  }) {
    const result = await PrinterGroupService.addPrinterToGroup(groupId, {
      printerId,
      location,
    });

    this.replacePrinterGroup(result);
  }

  @Action
  async addPrinterGroupToFloor({
    floorId,
    printerGroupId,
  }: {
    floorId: string;
    printerGroupId: string;
  }) {
    const result = await PrinterFloorService.addPrinterGroupToFloor(floorId, {
      printerGroupId,
    });

    this.replacePrinterFloor(result);
  }

  @Action
  async deletePrinterFromGroup({ groupId, printerId }: { groupId: string; printerId: string }) {
    const result = await PrinterGroupService.deletePrinterFromGroup(groupId, printerId);

    this.replacePrinterGroup(result);
  }

  @Action
  async deletePrinterGroupFromFloor({
    floorId,
    printerGroupId,
  }: {
    floorId: string;
    printerGroupId: string;
  }) {
    const result = await PrinterFloorService.deletePrinterGroupFromFloor(floorId, printerGroupId);

    this.replacePrinterFloor(result);
  }
}

export const printersState = getModule(PrintersModule, store);
