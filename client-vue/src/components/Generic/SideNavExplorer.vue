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
      <v-list-item v-for="item in items" :key="item.title" link>
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
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

@Component({
  data() {
    return {
      drawer: true,
      items: [
        { title: "Home", icon: "mdi-view-dashboard" },
        { title: "About", icon: "mdi-forum" }
      ]
    };
  }
})
export default class SideNavExplorer extends Vue {
  drawerOpened = false;
  loading = true;

  get storedViewedPrinter() {
    return printersState.currentViewedPrinter;
  }

  @Watch("storedViewedPrinter")
  async inputUpdate(viewedPrinter?: Printer, oldVal?: Printer) {
    this.drawerOpened = !!viewedPrinter;
    const printerId = viewedPrinter?.id;

    if (!viewedPrinter || !printerId) return;

    if (viewedPrinter.apiAccessibility.accessible) {
      await printersState.loadPrinterFiles({ printerId, recursive: false });
    }
    else {
      await PrinterFilesService.getFileCache(printerId);
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
