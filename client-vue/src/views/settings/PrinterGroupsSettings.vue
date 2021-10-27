<template>
  <v-card>
    <v-toolbar color="primary">
      <v-avatar>
        <v-icon>settings</v-icon>
      </v-avatar>
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

    <v-row no-gutters>
      <v-col>
        <v-list dense>
          <v-list-item-group v-model="selectedItem">
            <v-list-item v-for="group of printerGroups" :key="group._id">
              <v-list-item-content>
                <v-list-item-title>{{ group.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ group.printers.length || 0 }} assigned
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action-text>
                X: {{ group.location.x }}, Y: {{ group.location.y }}
              </v-list-item-action-text>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col>
        <v-toolbar>
          <v-hover v-slot="{ hover }">
            <v-toolbar-title>
              <v-edit-dialog v-if="selectedPrinterGroup" @open="setEditedPrinterGroupName"
                             @save="updatePrinterGroupName">
                <v-btn color="secondary">
                  <v-icon v-if="hover" small>edit</v-icon>
                  {{ selectedPrinterGroup.name }}
                </v-btn>

                <template v-slot:input>
                  <v-text-field
                    v-model="editedPrinterGroupName"
                    :return-value.sync="editedPrinterGroupName"
                    counter
                    label="Edit"
                    single-line
                  ></v-text-field>
                </template>
              </v-edit-dialog>

              <span v-else> Select a group on the left </span>

            </v-toolbar-title>
          </v-hover>

          <v-spacer></v-spacer>

          <v-btn color="primary" @click="clickDeleteGroup()" v-if="selectedPrinterGroup">
            <v-icon>delete</v-icon>
            Delete group
          </v-btn>

        </v-toolbar>

        <v-list v-if="selectedPrinterGroup">
          <v-list-item v-for="x in printersPerGroup" :key="x">
            <v-list-item-content v-if="printerInGroup(selectedPrinterGroup, x)">
              <v-list-item-title>
                {{ printerInGroup(selectedPrinterGroup, x).printerName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ printerLocation(selectedPrinterGroup, x) }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-content v-else>
              <em>Not assigned</em>
            </v-list-item-content>

            <v-list-item-action v-if="printerInGroup(selectedPrinterGroup, x)">
              <v-btn disabled>
                <v-icon>edit</v-icon>
                Change
              </v-btn>
            </v-list-item-action>
            <v-list-item-action v-else>
              <v-btn color="primary" disabled>
                <v-icon>add</v-icon>
                Assign
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-card>
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
  data: () => ({
    selectedItem: 0
  })
})
export default class PrinterGroupsSettings extends Vue {
  editedPrinterGroupName: string = "";
  selectedItem: number;
  readonly printersPerGroup = 4;

  get printerGroups() {
    return printersState.printerGroups;
  }

  get selectedPrinterGroup() {
    return printersState.printerGroups[this.selectedItem];
  }

  printerLocation(group: PrinterGroup, index: number) {
    return group?.printers[index - 1]?.location;
  }

  printerInGroup(group: PrinterGroup, index: number) {
    if (!group?.printers) return {};

    const printer = group.printers[index - 1];
    return printersState.printer(printer?.printerId);
  }

  async syncLegacyGroups() {
    const groups = await PrinterGroupService.syncLegacyGroups();

    this.$bus.emit(infoMessageEvent, `Succesfully synced ${ groups.length } groups!`);
  }

  setEditedPrinterGroupName() {
    this.editedPrinterGroupName = this.selectedPrinterGroup.name;
  }

  async updatePrinterGroupName() {
    if (!this.selectedPrinterGroup?._id) return;

    const { _id: groupId } = this.selectedPrinterGroup;
    await printersState.updatePrinterGroupName({ groupId, name: this.editedPrinterGroupName });
  }

  async clickDeleteGroup() {
    if (!this.selectedPrinterGroup?._id) return;

    await printersState.deletePrinterGroup(this.selectedPrinterGroup._id);
  }
}
</script>
