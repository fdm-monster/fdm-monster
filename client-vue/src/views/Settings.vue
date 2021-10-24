<template>
  <v-container>
    <v-navigation-drawer absolute>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Settings
          </v-list-item-title>
          <v-list-item-subtitle>
            Adjust your Hub
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list
        dense
        nav
      >
        <v-list-item
          v-for="item in items"
          :key="item.title"
          link
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-toolbar color="primary">
      <v-btn dark icon>
        <v-icon>settings</v-icon>
      </v-btn>
      <v-toolbar-title>Server Settings</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Groups and Files</v-subheader>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Legacy Groups</v-list-item-title>
          <v-list-item-subtitle>
            Synchronise the legacy printer groups to the new separate PrinterGroup data.
            <br />
            <v-btn color="primary" @click="syncLegacyGroups()">Sync legacy</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Clean file references</v-list-item-title>
          <v-list-item-subtitle>
            Clear out the file references for all printers - this does not remove them from
            OctoPrint!
            <br />
            <v-btn color="primary" @click="purgeFiles()">Purge file references</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Disable inefficient GCode analysis</v-list-item-title>
          <v-list-item-subtitle>
            Disable GCode analysis on all printers at once, preventing CPU intensive and inaccurate
            time/size estimates.
            <br />
            <v-btn color="primary" @click="bulkDisableGCodeAnalysis()"
              >Bulk disable GCode Analysis</v-btn
            >
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list v-show="false" subheader three-line>
      <v-subheader>General</v-subheader>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="notifications"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Notifications</v-list-item-title>
          <v-list-item-subtitle>
            Notify me about updates to apps or games that I downloaded
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="sound"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Sound</v-list-item-title>
          <v-list-item-subtitle
            >Auto-update apps at any time. Data charges may apply
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="widgets"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Auto-add widgets</v-list-item-title>
          <v-list-item-subtitle>Automatically add home screen widgets</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script>
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { PrinterGroupService, PrinterFileService } from "@/backend";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { printersState } from "@/store/printers.state";
import { PrinterSettingsService } from "@/backend/printer-settings.service";

@Component({
  components: {},
  data() {
    return {
      items: [
        { title: 'Printer groups', icon: 'dashboard' },
        { title: 'System settings', icon: 'image' },
        { title: 'Logs', icon: 'help' },
      ],
      right: null,
      dialog: false,
      notifications: false,
      sound: true,
      widgets: false
    };
  }
})
export default class Settings extends Vue {
  async syncLegacyGroups() {
    const groups = await PrinterGroupService.syncLegacyGroups();

    this.$bus.emit(infoMessageEvent, `Succesfully synced ${groups.length} groups!`);
  }

  async purgeFiles() {
    await PrinterFileService.purgeFiles();

    this.$bus.emit(infoMessageEvent, `Succesfully purged all references to printer files!`);
  }

  async bulkDisableGCodeAnalysis() {
    const printers = printersState.onlinePrinters;
    this.$bus.emit(
      infoMessageEvent,
      `Trying to disable gcode analysis for ${printers.length} online printers.`
    );
    for (let printer of printers) {
      await PrinterSettingsService.setGCodeAnalysis(printer.id, false);
    }
    this.$bus.emit(
      infoMessageEvent,
      `Finished disabling gcode analysis for ${printers.length} online printers.`
    );
  }
}
</script>
