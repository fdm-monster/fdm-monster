<template>
  <v-navigation-drawer
    v-model="drawerOpened"
    absolute
    loading="true"
    right
    temporary
    width="500"
    @close="closeDrawer()"
  >
    <v-list-item>
      <v-list-item-avatar color="primary">
        {{ avatarInitials() }}
      </v-list-item-avatar>
      <v-list-item-content v-if="storedViewedPrinter">
        <v-list-item-title>
          {{ storedViewedPrinter.printerName }}
          {{
            storedViewedPrinter.enabled && storedViewedPrinter.apiAccessibility.accessible
              ? "PRINTER ONLINE"
              : "OFFLINE/DISABLED"
          }}
        </v-list-item-title>
        <v-list-item-subtitle>Viewing printer files</v-list-item-subtitle>
        <v-list-item-subtitle v-if="storedViewedPrinter.currentJob">
          Printer progress: {{ storedViewedPrinter.currentJob.progress }}%
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense subheader two-line>
      <v-subheader inset>Commands</v-subheader>
      <v-list-item link @click.prevent.stop="clickStop()">
        <v-list-item-avatar>
          <v-icon> stop</v-icon>
        </v-list-item-avatar>
        <v-list-item-content> STOP</v-list-item-content>
      </v-list-item>

      <v-subheader inset>Files</v-subheader>

      <v-list-item v-if="!shownFiles">
        <v-list-item-avatar>
          <v-icon>clear</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>No files to show</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item v-for="(file, index) in filesListed" :key="index" link>
        <v-list-item-avatar>
          <v-icon>download</v-icon>
        </v-list-item-avatar>
        <v-list-item-action>
          <v-btn icon @click="printFile(file)">
            <v-icon color="grey darken-1">play_arrow</v-icon>
          </v-btn>
        </v-list-item-action>

        <v-list-item-icon>
          <v-icon>{{ file.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ file.name }}</v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn icon @click="deleteFile(file)">
            <v-icon color="grey lighten-1">delete</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";
import { Printer } from "@/models/printers/printer.model";
import { generateInitials } from "@/constants/noun-adjectives.data";
import { PrinterFileService } from "@/backend";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { PrinterFileBucket } from "@/models/printers/printer-file-bucket.model";

@Component({
  data: () => ({
    shownFiles: {}
  })
})
export default class SideNavExplorer extends Vue {
  drawerOpened = false;
  loading = true;
  shownFiles?: PrinterFileBucket;

  get printerId() {
    return this.storedViewedPrinter?.id;
  }

  get filesListed() {
    return this.shownFiles?.files || [];
  }

  get storedViewedPrinter() {
    return printersState.currentViewedPrinter;
  }

  @Watch("storedViewedPrinter")
  async inputUpdate(viewedPrinter?: Printer, oldVal?: Printer) {
    this.drawerOpened = !!viewedPrinter;
    const printerId = viewedPrinter?.id;

    if (!viewedPrinter || !printerId) return;

    if (!this.shownFiles || viewedPrinter.id !== this.shownFiles.printerId) {
      if (viewedPrinter.apiAccessibility.accessible) {
        let fileCache = await printersState.loadPrinterFiles({ printerId, recursive: false });
        this.shownFiles = {
          printerId,
          ...fileCache
        }
      } else {
        const fileCache = await PrinterFileService.getFileCache(printerId);
        this.shownFiles = {
          printerId,
          ...fileCache
        };
      }
    }
  }

  avatarInitials() {
    const viewedPrinter = this.storedViewedPrinter;
    if (viewedPrinter && this.drawerOpened) {
      return generateInitials(viewedPrinter.printerName);
    }
  }

  async deleteFile(file: PrinterFile) {
    if (!this.printerId) return;

    await printersState.deletePrinterFile({ printerId: this.printerId, fullPath: file.path });
  }

  clickStop() {
    printersState.sendStopJobCommand(this.printerId);
  }

  async printFile(file: PrinterFile) {
    if (!this.printerId) return;

    await printersState.selectAndPrintFile({ printerId: this.printerId, fullPath: file.path });
  }

  @Watch("drawerOpened")
  updateStore(newVal: boolean, oldVal: boolean) {
    // Due to the animation delay the nav model lags behind enough for SSE to pick up and override
    if (!newVal) {
      printersState.setViewedPrinter(undefined);
    }
  }

  closeDrawer() {
    printersState.setViewedPrinter(undefined);
  }
}
</script>
