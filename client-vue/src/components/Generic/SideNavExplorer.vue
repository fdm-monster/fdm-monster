<template>
  <v-navigation-drawer v-model="drawerOpened" absolute loading="true" right temporary @close="closeDrawer()">
    <v-list-item>
      <v-list-item-avatar>
        <v-img src="https://randomuser.me/api/portraits/men/78.jpg"></v-img>
      </v-list-item-avatar>

      <v-list-item-content v-if="storedViewedPrinter">
        <v-list-item-title>{{ storedViewedPrinter.printerName }}</v-list-item-title>
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
import { Prop, Watch } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";
import { Printer } from "@/models/printers/printer.model";

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
  @Prop() printer: Printer;
  drawerOpened = false;

  get storedViewedPrinter() {
    return printersState.currentViewedPrinter;
  }

  async created() {
    // await printersState.loadPrinterFiles({ printerId: this.printerId, recursive: false });
  }

  @Watch("storedViewedPrinter")
  inputUpdate(newVal?: Printer, oldVal?: Printer) {
    this.drawerOpened = !!newVal;
  }

  closeDrawer() {
    printersState.setViewedPrinter(undefined);
  }
}
</script>
