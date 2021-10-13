<template>
  <v-navigation-drawer
    v-model="drawerOpened"
    absolute
    loading="true"
    right
    temporary
    @close="closeDrawer()"
  >
    <v-icon>loading</v-icon>
    <v-list-item>
      <v-list-item-avatar color="primary">
        {{ avatarInitials() }}
      </v-list-item-avatar>
      <v-list-item-content v-if="storedViewedPrinter">
        <v-list-item-title>{{ storedViewedPrinter.printerName }}</v-list-item-title>
        <v-list-item-subtitle>Viewing printer files</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense>
      <v-list-item v-for="(item,index) in shownFiles" :key="index" link>
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item-content>
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
import { PrinterFile } from "@/models/printers/printer-file.model";

@Component({
  data: () => ({
    drawer: true,
    shownFiles: []
  })
})
export default class SideNavExplorer extends Vue {
  drawerOpened = false;
  loading = true;
  shownFiles: PrinterFile[] = [];

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
      const fileCache = await PrinterFilesService.getFileCache(printerId);
      this.shownFiles = fileCache.files;
    }
  }

  avatarInitials() {
    const viewedPrinter = this.storedViewedPrinter;
    if (viewedPrinter && this.drawerOpened) {
      return generateInitials(viewedPrinter.printerName);
    }
  }

  closeDrawer() {
    printersState.setViewedPrinter(undefined);
  }
}
</script>
