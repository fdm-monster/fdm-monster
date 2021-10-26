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
      <v-list-group
        v-for="group of printerGroups" :key="group.name"
        no-action
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title>{{ group.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ group.printers.length || 0 }} assigned
            </v-list-item-subtitle>
          </v-list-item-content>
        </template>

        <v-list-item
          v-for="x in printersPerGroup"
          :key="x"
        >
          <v-list-item-content v-if="printerInGroup(group, x)">
            <v-list-item-title>
              {{ printerInGroup(group, x).printerName }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ printerLocation(group, x) }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-content v-else>
            <em>Not assigned</em>
          </v-list-item-content>

          <v-list-item-action v-if="printerInGroup(group, x)">
            <v-btn>
              <v-icon>edit</v-icon> Edit printer
            </v-btn>
          </v-list-item-action>
          <v-list-item-action v-else>
              <v-btn>
                <v-icon>add</v-icon> Add new printer
              </v-btn>
          </v-list-item-action>

        </v-list-item>
      </v-list-group>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { PrinterGroupService } from "@/backend";
import { infoMessageEvent } from "@/event-bus/alert.events";
import { printersState } from "@/store/printers.state";
import { PrinterGroup } from "@/models/printers/printer-group.model";

@Component({
  components: {},
})
export default class PrinterGroupsSettings extends Vue {
  readonly printersPerGroup = 4;

  get printerGroups() {
    return printersState.printerGroups;
  }

  printerLocation(group: PrinterGroup, index: number) {
    return group.printers[index - 1]?.location;
  }

  printerInGroup(group: PrinterGroup, index: number) {
    const printer = group.printers[index - 1];
    return printersState.printer(printer?.printerId);
  }

  async syncLegacyGroups() {
    const groups = await PrinterGroupService.syncLegacyGroups();

    this.$bus.emit(infoMessageEvent, `Succesfully synced ${ groups.length } groups!`);
  }
}
</script>
