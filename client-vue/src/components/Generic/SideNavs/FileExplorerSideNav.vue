<template>
  <v-navigation-drawer
    v-model="drawerOpened"
    absolute
    loading="true"
    right
    temporary
    width="700"
    @close="closeDrawer()"
  >
    <v-list-item>
      <v-list-item-avatar>
        <v-btn color="primary" fab @click="openPrinterURL()" @click.middle="openPrinterURL()">
          {{ avatarInitials() }}
        </v-btn>
      </v-list-item-avatar>
      <v-list-item-content v-if="storedSideNavPrinter">
        <v-list-item-title>
          {{ storedSideNavPrinter.printerName }}
          <strong> ({{ storedSideNavPrinter.enabled ? "enabled" : "disabled" }}) </strong>
          <strong
            v-if="storedSideNavPrinter.printerState.state === 'Operational'"
            class="float-end"
          >
            {{ storedSideNavPrinter.printerState.state }}
          </strong>
          <strong
            v-if="
              !storedSideNavPrinter.enabled || !storedSideNavPrinter.apiAccessibility.accessible
            "
            class="float-end"
          >
            OFFLINE/DISABLED
          </strong>
          <strong
            v-if="
              storedSideNavPrinter.printerState.state !== 'Operational' &&
              storedSideNavPrinter.apiAccessibility.accessible
            "
            class="float-end pulsating-red"
          >
            {{ storedSideNavPrinter.printerState.state }}
          </strong>
        </v-list-item-title>
        <v-list-item-subtitle v-if="storedSideNavPrinter.currentJob">
          <span v-if="storedSideNavPrinter.currentJob.progress" class="d-flex justify-center">
            Progress:
            {{ truncateProgress(storedSideNavPrinter.currentJob.progress) }}%
          </span>
          <v-progress-linear
            v-if="storedSideNavPrinter.currentJob"
            :value="truncateProgress(storedSideNavPrinter.currentJob.progress)"
            class="mt-1 mb-1"
            height="8px"
          >
          </v-progress-linear>

          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn outlined small v-bind="attrs" v-on="on">
                {{ currentJob().fileName }}
              </v-btn>
            </template>
            <span>{{ currentJob().fileName }}</span>
          </v-tooltip>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-alert
      v-if="!storedSideNavPrinter?.enabled || !storedSideNavPrinter?.apiAccessibility?.accessible"
      color="primary"
    >
      <span v-if="!storedSideNavPrinter?.enabled">
        Disabled OctoPrint, enable it first to get live updates
      </span>
      <span v-else>
        This OctoPrint seems unreachable... Will keep trying for you <v-icon>hourglass_top</v-icon>
      </span>
    </v-alert>
    <v-alert
      v-if="!storedSideNavPrinter?.enabled && !storedSideNavPrinter?.disabledReason"
      color="secondary"
    >
      This OctoPrint was disabled without reason.
    </v-alert>
    <v-alert v-if="storedSideNavPrinter?.disabledReason" color="black">
      This OctoPrint was disabled for maintenance: <br />
      <small>&nbsp;&nbsp;{{ storedSideNavPrinter?.disabledReason }} </small>
    </v-alert>
    <v-divider></v-divider>

    <v-list v-drop-upload="{ printers: [storedSideNavPrinter] }" dense subheader>
      <v-subheader inset>Manage FDM Monster instance</v-subheader>

      <v-list-item class="extra-dense-list-item" link @click.prevent.stop="toggleEnabled()">
        <v-list-item-avatar>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon :color="isEnabled ? 'primary' : 'green'" dark v-bind="attrs" v-on="on">
                dns
              </v-icon>
            </template>
            <span>This does not impact your print</span>
          </v-tooltip>
        </v-list-item-avatar>
        <v-list-item-content>
          <span v-if="isEnabled">Disable Printer Location</span>
          <span v-else-if="!isEnabled">Enable Printer Location</span>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="extra-dense-list-item" link @click.prevent.stop="toggleMaintenance()">
        <v-list-item-avatar>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                :color="!isUnderMaintenance ? 'primary' : 'green'"
                dark
                v-bind="attrs"
                v-on="on"
              >
                construction
              </v-icon>
            </template>
            <span>This does not impact your print</span>
          </v-tooltip>
        </v-list-item-avatar>
        <v-list-item-content>
          <span v-if="!isUnderMaintenance">Enable Maintenance</span>
          <span v-else-if="isUnderMaintenance">Complete Maintenance</span>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>
      <v-subheader inset>Commands</v-subheader>

      <v-list-item
        :disabled="isStoppable"
        class="extra-dense-list-item"
        link
        @click.prevent.stop="togglePrinterConnection()"
      >
        <v-list-item-avatar>
          <v-icon>usb</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <span v-if="isStoppable">Disconnect - stop print first</span>
          <span v-else-if="isOperational">Disconnect USB</span>
          <span v-else>Connect USB</span>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        :disabled="!isStoppable"
        class="extra-dense-list-item"
        link
        @click.prevent.stop="clickEmergencyStop()"
      >
        <v-list-item-avatar>
          <v-icon>stop</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>Stop print {{ isStoppable ? "" : "- No job" }}</v-list-item-content>
      </v-list-item>

      <v-list-item
        :disabled="!canBeCleared"
        class="extra-dense-list-item"
        link
        @click.prevent.stop="clickClearFiles()"
      >
        <v-list-item-avatar>
          <v-icon>delete</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          Delete files {{ canBeCleared ? "" : "- Nothing to do" }}
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        class="extra-dense-list-item"
        link
        @click.prevent.stop="refreshFiles(storedSideNavPrinter)"
      >
        <v-list-item-avatar>
          <v-icon>refresh</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>Refresh files</v-list-item-content>
      </v-list-item>

      <v-list-item class="extra-dense-list-item" link @click.prevent.stop="clickSettings()">
        <v-list-item-avatar>
          <v-icon>settings</v-icon>
        </v-list-item-avatar>
        <v-list-item-content> Settings</v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list v-drop-upload="{ printers: [storedSideNavPrinter] }" dense subheader>
      <v-subheader inset>Files - drag 'n drop!</v-subheader>

      <!-- Empty file list -->
      <v-list-item v-if="!filesListed.length">
        <v-list-item-avatar>
          <v-icon>clear</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>No files to show</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- Loading file list-->
      <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

      <v-list-item v-for="(file, index) in filesListed" :key="index" link>
        <v-list-item-avatar>
          <v-tooltip left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" @click="clickDownloadFile(file)" v-on="on">
                <v-icon>download</v-icon>
              </v-btn>
            </template>
            <span>Download GCode</span>
          </v-tooltip>
        </v-list-item-avatar>

        <v-list-item-action>
          <v-tooltip left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                :disabled="isFileBeingPrinted(file)"
                icon
                v-bind="attrs"
                @click="clickPrintFile(file)"
                v-on="on"
              >
                <v-icon>play_arrow</v-icon>
              </v-btn>
            </template>
            <span>Select & Print</span>
          </v-tooltip>
        </v-list-item-action>

        <v-list-item-content>
          <v-tooltip left>
            <template v-slot:activator="{ on, attrs }">
              <span
                :class="{ 'current-file-print': isFileBeingPrinted(file) }"
                v-bind="attrs"
                v-on="on"
              >
                {{ file.name }}
              </span>
            </template>
            <span>
              File: {{ file.name }} <br />
              Size: {{ formatBytes(file.size) }} <br />
              <strong>{{ isFileBeingPrinted(file) ? "Printing" : "Unused" }}</strong>
            </span>
          </v-tooltip>
        </v-list-item-content>

        <v-list-item-action>
          <v-tooltip left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                :disabled="isFileBeingPrinted(file)"
                icon
                v-bind="attrs"
                @click="deleteFile(file)"
                v-on="on"
              >
                <v-icon color="grey lighten-1">delete</v-icon>
              </v-btn>
            </template>
            <span> Delete file </span>
          </v-tooltip>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Printer } from "@/models/printers/printer.model";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { PrinterFileService, PrintersService } from "@/backend";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFileBucket } from "@/models/printers/printer-file-bucket.model";
import { isPrinterStoppable } from "@/utils/printer-state.utils";
import { formatBytes } from "@/utils/file-size.util";
import { CustomGcodeService } from "@/backend/custom-gcode.service";

import { usePrintersStore } from "@/store/printers.store";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";
import { useDialogsStore } from "@/store/dialog.store";

interface Data {
  shownFileBucket?: PrinterFileBucket;
  drawerOpened: boolean;
  loading: boolean;
}

export default defineComponent({
  name: "FileExplorerSideNav",
  components: {},
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      dialogsStore: useDialogsStore(),
    };
  },
  async created() {},
  async mounted() {},
  props: {},
  data: (): Data => ({
    shownFileBucket: undefined,
    drawerOpened: false,
    loading: true,
  }),
  computed: {
    storedSideNavPrinter() {
      return this.printersStore.sideNavPrinter;
    },
    printerId() {
      return this.storedSideNavPrinter?.id;
    },
    isOperational() {
      return this.printersStore.isPrinterOperational(this.printerId);
    },
    isEnabled() {
      return this.storedSideNavPrinter?.enabled;
    },
    isUnderMaintenance() {
      return !!this.storedSideNavPrinter?.disabledReason?.length;
    },
    filesListed() {
      return this.shownFileBucket?.files || [];
    },
    isStoppable() {
      if (!this.storedSideNavPrinter) return false;
      return isPrinterStoppable(this.storedSideNavPrinter);
    },
    canBeCleared() {
      return (
        this.shownFileBucket?.files?.length &&
        this.storedSideNavPrinter?.apiAccessibility.accessible
      );
    },
  },
  methods: {
    formatBytes: formatBytes,
    truncateProgress(progress: number) {
      if (!progress) return "";
      return progress?.toFixed(1);
    },
    isFileBeingPrinted(file: PrinterFile) {
      if (!this.storedSideNavPrinter) return false;
      // Completed job will not disappear (yet)
      if (this.storedSideNavPrinter.printerState.state === "Operational") return false;
      return this.storedSideNavPrinter.currentJob?.fileName === file.name;
    },
    currentJob() {
      return this.storedSideNavPrinter?.currentJob || {};
    },
    avatarInitials() {
      const viewedPrinter = this.storedSideNavPrinter;
      if (viewedPrinter && this.drawerOpened) {
        return generateInitials(viewedPrinter.printerName);
      }
    },
    openPrinterURL() {
      if (!this.storedSideNavPrinter) return;
      PrintersService.openPrinterURL(this.storedSideNavPrinter.printerURL);
      this.closeDrawer();
    },
    async togglePrinterConnection() {
      if (!this.printerId) return;
      if (this.printersStore.isPrinterOperational(this.printerId)) {
        return await PrintersService.sendPrinterDisconnectCommand(this.printerId);
      }
      await PrintersService.sendPrinterConnectCommand(this.printerId);
    },
    async toggleEnabled() {
      if (!this.printerId) {
        throw new Error("Printer ID not set, cant toggle enabled");
      }
      if (!this.storedSideNavPrinter) {
        throw new Error("Cant toggle enabled, sidenav printer unset");
      }
      const newSetting = !this.storedSideNavPrinter.enabled;
      await PrintersService.toggleEnabled(this.printerId, newSetting);
    },
    async toggleMaintenance() {
      if (!this.printerId) {
        throw new Error("Printer ID not set, cant toggle maintenance");
      }
      if (!this.storedSideNavPrinter) {
        throw new Error("Cant toggle enabled, sidenav printer unset");
      }
      if (this.isUnderMaintenance) {
        await PrintersService.updatePrinterMaintenance(this.printerId);
        return;
      }

      this.printersStore.setMaintenanceDialogPrinter(this.storedSideNavPrinter);
      this.dialogsStore.openDialog(DialogName.PrinterMaintenanceDialog);
      this.closeDrawer();
    },
    async refreshFiles(viewedPrinter: Printer) {
      this.loading = true;
      const printerId = viewedPrinter.id;
      // Offline printer fallback
      if (viewedPrinter.apiAccessibility.accessible) {
        const fileCache = await this.printersStore.loadPrinterFiles({
          printerId,
          recursive: false,
        });
        this.shownFileBucket = {
          printerId,
          ...fileCache,
        };
      } else {
        const fileCache = await PrinterFileService.getFileCache(printerId);
        this.shownFileBucket = {
          printerId,
          ...fileCache,
        };
      }
      this.loading = false;
    },
    async deleteFile(file: PrinterFile) {
      if (!this.printerId) return;
      await this.printersStore.deletePrinterFile({
        printerId: this.printerId,
        fullPath: file.path,
      });
    },
    async clickEmergencyStop() {
      if (!this.printerId) return;

      if (confirm("Are you sure to abort the print? Please reconnect after.")) {
        await CustomGcodeService.postEmergencyM112Command(this.printerId);
      }
    },
    async clickClearFiles() {
      if (!this.printerId) return;
      this.loading = true;
      await this.printersStore.clearPrinterFiles(this.printerId);
      this.loading = false;
      this.shownFileBucket = this.printersStore.printerFileBucket(this.printerId);
    },
    clickSettings() {
      if (!this.storedSideNavPrinter) return;
      this.printersStore.setUpdateDialogPrinter(this.storedSideNavPrinter);
      this.dialogsStore.openDialog(DialogName.UpdatePrinterDialog);
      this.closeDrawer();
    },
    async clickPrintFile(file: PrinterFile) {
      if (!this.printerId) return;
      await this.printersStore.selectAndPrintFile({
        printerId: this.printerId,
        fullPath: file.path,
      });
    },
    clickDownloadFile(file: PrinterFile) {
      PrinterFileService.downloadFile(file);
    },
    closeDrawer() {
      this.printersStore.setSideNavPrinter(undefined);
    },
  },
  watch: {
    async storedSideNavPrinter(viewedPrinter?: Printer, oldVal?: Printer) {
      this.drawerOpened = !!viewedPrinter;
      const printerId = viewedPrinter?.id;
      if (!viewedPrinter || !printerId) {
        return;
      }

      if (!this.shownFileBucket || viewedPrinter.id !== this.shownFileBucket.printerId || !oldVal) {
        await this.refreshFiles(viewedPrinter);
      }
    },
    drawerOpened(newVal: boolean) {
      // Due to the animation delay the nav model lags behind enough for SSE to pick up and override
      if (!newVal) {
        this.printersStore.setSideNavPrinter(undefined);
      }
    },
  },
});
</script>

<style>
.extra-dense-list-item {
  margin-top: -7px;
}

.current-file-print {
  color: red;
}

.pulsating-red {
  background: darkred;
  margin: 10px;
  border-radius: 15px;

  box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
  transform: scale(1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}
</style>
