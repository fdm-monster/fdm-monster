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
        <v-list-item-subtitle>
          Nozzle Temp: {{ storedViewedPrinter.tools[0].chamber }}%
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense subheader two-line>
      <v-subheader inset>Commands</v-subheader>
      <v-list-item link>
        <v-list-item-avatar>
          <v-icon> stop</v-icon>
        </v-list-item-avatar>
        <v-list-item-content> STOP</v-list-item-content>
      </v-list-item>

      <v-subheader inset>Files</v-subheader>

      <v-list-item v-for="(item, index) in shownFiles.files" :key="index" link>
        <v-list-item-avatar>
          <v-icon> download</v-icon>
        </v-list-item-avatar>
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn icon @click="deleteFile(item)">
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
import { PrinterFilesService } from "@/backend";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";
import { PrinterFile } from "@/models/printers/printer-file.model";

@Component({
  data: () => ({
    shownFiles: []
  })
})
export default class SideNavExplorer extends Vue {
  drawerOpened = false;
  loading = true;
  shownFiles?: PrinterFileCache = undefined;

  get printerId() {
    return this.storedViewedPrinter?.id;
  }

  get storedViewedPrinter() {
    return printersState.currentViewedPrinter;
  }

  @Watch("storedViewedPrinter")
  async inputUpdate(viewedPrinter?: Printer, oldVal?: Printer) {
    this.drawerOpened = !!viewedPrinter;
    const printerId = viewedPrinter?.id;

    if (!viewedPrinter || !printerId) return;

    if (viewedPrinter.apiAccessibility.accessible) {
      this.shownFiles = await printersState.loadPrinterFiles({ printerId, recursive: false });
    } else {
      this.shownFiles = await PrinterFilesService.getFileCache(printerId);
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
