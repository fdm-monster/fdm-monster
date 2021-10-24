<template>
  <v-container>
    <v-toolbar color="primary">
      <v-btn dark icon>
        <v-icon>settings</v-icon>
      </v-btn>
      <v-toolbar-title>Printer Group Management</v-toolbar-title>
    </v-toolbar>
    <v-list subheader three-line>
      <v-subheader>Printer Groups</v-subheader>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Legacy Groups</v-list-item-title>
          <v-list-item-subtitle>
            Convert the legacy printer group to the new separate PrinterGroup data.
            <br/>
            <v-btn color="primary" @click="syncLegacyGroups()">Sync legacy</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list>
      <v-list-item>
        <v-list-item-content v-for="group of printerGroups" :key="group.name">
          <v-list-item-title>
          {{ group.name }}
            <br/>
          </v-list-item-title>
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
})
export default class PrinterGroupsSettings extends Vue {
  get printerGroups() {
    return printersState.printerGroups;
  }

  async syncLegacyGroups() {
    const groups = await PrinterGroupService.syncLegacyGroups();

    this.$bus.emit(infoMessageEvent, `Succesfully synced ${ groups.length } groups!`);
  }
}
</script>
