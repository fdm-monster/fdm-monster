import { defineStore } from "pinia";
import { Printer } from "@/models/printers/printer.model";
import { PrinterFileBucket } from "@/models/printers/printer-file-bucket.model";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { ClearedFilesResult } from "@/models/printers/printer-file.model";
import { PrinterFileService, PrinterGroupService, PrintersService } from "@/backend";
import { CreatePrinter } from "@/models/printers/crud/create-printer.model";
import { CreatePrinterGroup } from "@/models/printer-groups/crud/create-printer-group.model";
import { PrinterFloorService } from "@/backend/printer-floor.service";
import { PrinterJobService } from "@/backend/printer-job.service";
import { defaultBedTemp, defaultBedTempOverride } from "@/constants/app.constants";

const horizontalOffset = 1;

interface State {
  printers: Printer[];
  testPrinters?: Printer;
  printerFileBuckets: PrinterFileBucket[];
  printerGroups: PrinterGroup[];
  floors: PrinterFloor[];
  selectedFloor?: PrinterFloor;

  bedTempOverride: boolean;
  bedTemp: number | null;
  sideNavPrinter?: Printer;
  updateDialogPrinter?: Printer;
  updateDialogPrinterGroup?: PrinterGroup;
  selectedPrinters: Printer[];
  maintenanceDialogPrinter?: Printer;
}

export const usePrintersStore = defineStore("Printers", {
  state: (): State => ({
    printers: [],
    testPrinters: undefined,
    printerFileBuckets: [],
    printerGroups: [],
    floors: [],
    selectedFloor: undefined,

    bedTempOverride: defaultBedTempOverride,
    bedTemp: defaultBedTemp,
    sideNavPrinter: undefined,
    updateDialogPrinter: undefined,
    updateDialogPrinterGroup: undefined,
    selectedPrinters: [],
    maintenanceDialogPrinter: undefined,
  }),
  getters: {
    printerFloors(state) {
      return state.floors.sort((f, f2) => f.floor - f2.floor);
    },
    printerFloor(state) {
      return (floorId: string) => state.floors.find((pf) => pf._id === floorId);
    },
    printerGroup(state) {
      return (groupId: string) => state.printerGroups.find((pg) => pg._id === groupId);
    },
    floorOfGroup() {
      return (printerGroupId: string) => {
        return this.printerFloors.find((pf: PrinterFloor) =>
          pf.printerGroups.map((pid) => pid.printerGroupId).includes(printerGroupId)
        );
      };
    },
    gridSortedPrinterGroups(state) {
      if (!state.printerGroups) return () => [];

      // TODO loader
      if (!state.selectedFloor) return () => [];

      const relevantPrinterGroupIds = state.selectedFloor.printerGroups.map(
        (spfg) => spfg.printerGroupId
      );
      const relevantGroups = state.printerGroups.filter((pg) =>
        relevantPrinterGroupIds.includes(pg._id!)
      );

      return (cols: number, rows: number) => {
        const groupMatrix: any[] = [];

        for (let i = 0; i < cols; i++) {
          groupMatrix[i] = [];
          for (let j = 0; j < rows; j++) {
            groupMatrix[i][j] = relevantGroups.find(
              (pg) => pg.location.x + horizontalOffset === i && pg.location.y === j
            );
          }
        }

        return groupMatrix;
      };
    },
    floorlessGroups(state): PrinterGroup[] {
      return state.printerGroups.filter(
        (p) => !this.floors.find((g) => g.printerGroups.find((pgp) => pgp.printerGroupId === p._id))
      );
    },
    printer() {
      return (printerId?: string) => this.printers.find((p) => p.id === printerId);
    },
    groupOfPrinter(state) {
      return (printerId: string) =>
        state.printerGroups?.length
          ? this.printerGroups?.find((pg) =>
              pg.printers.map((pid) => pid.printerId).includes(printerId)
            )
          : undefined;
    },
    onlinePrinters(state) {
      return state.printers.filter((p) => p.apiAccessibility.accessible);
    },
    printersWithJob(state) {
      return state.printers.filter(
        // If flags are falsy, we can skip the printer => it's still connecting
        (p) =>
          p.printerState.flags && (p.printerState.flags.printing || p.printerState.flags.printing)
      );
    },
    ungroupedPrinters(): Printer[] {
      return this.printers.filter(
        (p) => !this.printerGroups.find((g) => g.printers.find((pgp) => pgp.printerId === p.id))
      );
    },
    isSelectedPrinter(state) {
      return (printerId?: string) =>
        !!state.selectedPrinters.find((p: Printer) => p.id === printerId);
    },
    isPrinterOperational() {
      return (printerId?: string) => this.printer(printerId)?.printerState?.flags?.operational;
    },
    isPrinterPrinting() {
      return (printerId?: string) => this.printer(printerId)?.printerState?.flags?.printing;
    },
    printerFileBucket() {
      return (printerId?: string) => this.printerFileBuckets.find((p) => p.printerId === printerId);
    },
    printerFiles() {
      return (printerId?: string) => this.printerFileBucket(printerId)?.files;
    },
    printerGroupNames(state) {
      return state.printerGroups.map((pg: PrinterGroup) => pg.name);
    },
  },
  actions: {
    setBedTemp(bedTemp: number = 50) {
      this.bedTemp = bedTemp;
    },
    setBedTempOverride(bedTempOverride: boolean) {
      this.bedTempOverride = bedTempOverride;
    },
    resetBedTempOverride() {
      this.bedTemp = defaultBedTemp;
      this.bedTempOverride = defaultBedTempOverride;
    },
    async createPrinter(newPrinter: CreatePrinter) {
      const data = await PrintersService.createPrinter(newPrinter);
      this.printers.push(data);
      this.printers.sort((a: Printer, b: Printer) => (a.sortIndex > b.sortIndex ? 1 : -1));
      return data;
    },
    async createTestPrinter(newPrinter: CreatePrinter) {
      const data = await PrintersService.testConnection(newPrinter);
      this.testPrinters = data;
      return data;
    },
    // TODO renamed
    toggleSelectedPrinter(printer: Printer) {
      const selectedPrinterIndex = this.selectedPrinters.findIndex((sp) => sp.id == printer.id);
      if (selectedPrinterIndex === -1) {
        if (printer.apiAccessibility.accessible) {
          this.selectedPrinters.push(printer);
        }
      } else {
        this.selectedPrinters.splice(selectedPrinterIndex, 1);
      }
    },
    async createPrinterFloor(newPrinterFloor: PrinterFloor) {
      const data = await PrinterFloorService.createFloor(newPrinterFloor);
      this.floors.push(data);
      return data;
    },
    savePrinterFloors(floors: PrinterFloor[]) {
      this.floors = floors.sort((f, f2) => f.floor - f2.floor);
      if (!this.selectedFloor) {
        this.selectedFloor = this.printerFloors[0];
      }
    },
    async changeSelectedFloorByIndex(selectedPrinterFloorIndex: number) {
      if (!this.floors?.length) return;
      if (this.floors.length <= selectedPrinterFloorIndex) return;

      // SSE will sync result
      const newFloor = this.floors[selectedPrinterFloorIndex];
      // TODO throw warning?
      if (!newFloor) return;
      this.selectedFloor = newFloor;
      return newFloor;
    },
    clearSelectedPrinters() {
      this.selectedPrinters = [];
    },
    setSideNavPrinter(printer?: Printer) {
      this.sideNavPrinter = printer;
    },
    setUpdateDialogPrinter(printer?: Printer) {
      this.updateDialogPrinter = printer;
    },
    setUpdateDialogPrinterGroup(printerGroup?: PrinterGroup) {
      this.updateDialogPrinterGroup = printerGroup;
    },
    setMaintenanceDialogPrinter(printer?: Printer) {
      this.maintenanceDialogPrinter = printer;
    },
    /* Printers */
    async updatePrinter({
      printerId,
      updatedPrinter,
    }: {
      printerId: string;
      updatedPrinter: CreatePrinter;
    }) {
      const data = await PrintersService.updatePrinter(printerId, updatedPrinter);
      this._replacePrinter({ printerId, printer: data });
      return data;
    },
    async loadPrinters() {
      const data = await PrintersService.getPrinters();
      this.setPrinters(data);
      return data;
    },
    async deletePrinter(printerId: string) {
      const data = await PrintersService.deletePrinter(printerId);
      this._popPrinter(printerId);
      return data;
    },
    setPrinters(printers: Printer[]) {
      const viewedPrinterId = this.sideNavPrinter?.id;
      if (viewedPrinterId) {
        this.sideNavPrinter = printers.find((p) => p.id === viewedPrinterId);
      }
      this.printers = printers;
    },
    _popPrinter(printerId: string) {
      const printerIndex = this.printers.findIndex((p: Printer) => p.id === printerId);

      if (printerIndex !== -1) {
        this.printers.splice(printerIndex, 1);
      } else {
        console.warn("Printer was not popped as it did not occur in state", printerId);
      }
    },
    _replacePrinter({ printerId, printer }: { printerId: string; printer: Printer }) {
      const printerIndex = this.printers.findIndex((p: Printer) => p.id === printerId);

      if (printerIndex !== -1) {
        this.printers[printerIndex] = printer;
      } else {
        console.warn("Printer was not purged as it did not occur in state", printerId);
      }
    },
    /* PrinterGroups */
    async createPrinterGroup(newPrinterGroup: CreatePrinterGroup) {
      const data = await PrinterGroupService.createGroup(newPrinterGroup);
      // No need to sort as `gridSortedPrinterGroups` will fix this on the go
      this.printerGroups.push(data);
      return data;
    },
    savePrinterGroups(printerGroups: PrinterGroup[]) {
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
      return this.printerGroups;
    },
    async loadPrinterGroups() {
      if (!this.selectedFloor) {
        // TODO Gotta figure something out to still show printers
      }
      const data = await PrinterGroupService.getGroups();
      this.savePrinterGroups(data);
      return data;
    },
    async updatePrinterGroup({
      printerGroupId,
      updatePrinterGroup,
    }: {
      printerGroupId: string;
      updatePrinterGroup: CreatePrinterGroup;
    }) {
      const data = await PrinterGroupService.updateGroup(printerGroupId, updatePrinterGroup);
      this._replacePrinterGroup(data);
      return data;
    },
    async updatePrinterGroupName({ groupId, name }: { groupId: string; name: string }) {
      const group = await PrinterGroupService.updateGroupName(groupId, name);
      this._replacePrinterGroup(group);
      return group;
    },
    async deletePrinterGroup(groupId: string) {
      await PrinterGroupService.deleteGroup(groupId);

      this._popPrinterGroup(groupId);
    },
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

      this._replacePrinterGroup(result);
    },
    async deletePrinterFromGroup({ groupId, printerId }: { groupId: string; printerId: string }) {
      const result = await PrinterGroupService.deletePrinterFromGroup(groupId, printerId);
      this._replacePrinterGroup(result);
    },
    _popPrinterGroup(groupId: string) {
      const foundGroupIndex = this.printerGroups.findIndex((pg) => pg._id === groupId);
      if (foundGroupIndex !== -1) {
        this.printerGroups.splice(foundGroupIndex, 1);
      }
    },
    _replacePrinterGroup(printerGroup: PrinterGroup) {
      const foundGroupIndex = this.printerGroups.findIndex((pg) => pg._id === printerGroup._id);
      if (foundGroupIndex !== -1) {
        this.printerGroups[foundGroupIndex] = printerGroup;
      }
    },
    /* Floors */
    async deletePrinterFloor(floorId: string) {
      await PrinterFloorService.deleteFloor(floorId);
      this._popPrinterFloor(floorId);
    },
    async updatePrinterFloorName({ floorId, name }: { floorId: string; name: string }) {
      const floor = await PrinterFloorService.updateFloorName(floorId, name);
      this._replacePrinterFloor(floor);
      return floor;
    },
    async updatePrinterFloorNumber({
      floorId,
      floorNumber,
    }: {
      floorId: string;
      floorNumber: number;
    }) {
      const floor = await PrinterFloorService.updateFloorNumber(floorId, floorNumber);
      this._replacePrinterFloor(floor);
      return floor;
    },
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
      this._replacePrinterFloor(result);
    },
    async deletePrinterGroupFromFloor({
      floorId,
      printerGroupId,
    }: {
      floorId: string;
      printerGroupId: string;
    }) {
      const result = await PrinterFloorService.deletePrinterGroupFromFloor(floorId, printerGroupId);
      this._replacePrinterFloor(result);
    },
    _popPrinterFloor(floorId: string) {
      const foundFloorIndex = this.floors.findIndex((pg) => pg._id === floorId);
      if (foundFloorIndex !== -1) {
        this.floors.splice(foundFloorIndex, 1);
      }
    },
    _replacePrinterFloor(printerFloor: PrinterFloor) {
      const foundFloorIndex = this.floors.findIndex((pf) => pf._id === printerFloor._id);
      if (foundFloorIndex !== -1) {
        this.floors[foundFloorIndex] = printerFloor;
      }
    },
    async clearPrinterFiles(printerId: string) {
      // TODO diagnostics
      if (!printerId) return;
      // TODO axios type, TODO OpenAPI
      const result = (await PrinterFileService.clearFiles(printerId)) as ClearedFilesResult;
      if (!result?.failedFiles) {
        throw new Error("No failed files were returned");
      }
      const bucket = this.printerFileBuckets.find((b) => b.printerId === printerId);
      if (bucket) {
        bucket.files = result.failedFiles;
      }
    },
    async loadPrinterFiles({ printerId, recursive }: { printerId: string; recursive: boolean }) {
      const fileList = await PrinterFileService.getFiles(printerId, recursive);

      fileList.files.sort((f1, f2) => {
        return f1.date < f2.date ? 1 : -1;
      });

      let fileBucket = this.printerFileBuckets.find((p) => p.printerId === printerId);
      if (!fileBucket) {
        fileBucket = {
          printerId,
          ...fileList,
        };
        // TODO test: sorted and set
        this.printerFileBuckets.push(fileBucket);
      } else {
        fileBucket.files = fileList.files;
      }

      // Note: just the list, not the bucket
      return fileList;
    },
    async deletePrinterFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
      await PrinterFileService.deleteFileOrFolder(printerId, fullPath);

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

      return this.printerFiles(printerId);
    },
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
    },
    async selectAndPrintFile({ printerId, fullPath }: { printerId: string; fullPath: string }) {
      if (!printerId) return;
      const printer = this.printer(printerId);
      if (!printer) return;

      if (printer.printerState.flags.printing || !printer.apiAccessibility.accessible) {
        alert("This printer is printing or not connected! Either way printing is not an option.");
        return;
      }

      const bedTemp = this.bedTempOverride ? this.bedTemp : null;
      await PrinterFileService.selectAndPrintFile(printerId, fullPath, true, bedTemp);
      this.resetBedTempOverride();
    },
  },
});
