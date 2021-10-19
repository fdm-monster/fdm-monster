<template>
  <v-container>
    <v-toolbar color="primary" dark>
      <v-btn dark icon @click="dialog = false">
        <v-icon>close</v-icon>
      </v-btn>
      <v-toolbar-title>Server Settings</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn dark text @click="dialog = false" disabled> Save</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Groups and Files</v-subheader>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Legacy Groups</v-list-item-title>
          <v-list-item-subtitle>
            Synchronise the legacy printer groups to the new separate PrinterGroup data.
            <br/>
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
            <br/>
            <v-btn color="primary" @click="purgeFiles()">Purge file references</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list subheader three-line v-show="false">
      <v-subheader>General</v-subheader>
      <v-list-item>
        <v-list-item-action>
          <v-checkbox v-model="notifications"></v-checkbox>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Notifications</v-list-item-title>
          <v-list-item-subtitle
            >Notify me about updates to apps or games that I downloaded
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

@Component({
  components: {},
  data() {
    return {
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
}
</script>
