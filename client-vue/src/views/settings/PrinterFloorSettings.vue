<template>
  <v-card>
    <v-toolbar color="primary">
      <v-avatar>
        <v-icon>settings</v-icon>
      </v-avatar>
      <v-toolbar-title>Printer Floor Management</v-toolbar-title>
    </v-toolbar>

    <v-list subheader three-line>
      <v-subheader>Printer Floors</v-subheader>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Create new floor</v-list-item-title>
          <v-list-item-subtitle>
            Creates an empty department/floor to view printer groups
            <br />
            <v-btn color="primary" @click="createFloor()">Create floor</v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-row no-gutters>
      <v-col>
        <v-list dense>
          <v-list-item-group v-model="selectedItem">
            <v-list-item v-for="floor of printerFloors" :key="floor._id">
              <v-list-item-content>
                <v-list-item-title>{{ floor.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ floor.printerGroups.length || 0 }} assigned
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action-text> Floor number: {{ floor.floor }} </v-list-item-action-text>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col>
        <v-toolbar>
          <v-hover v-slot="{ hover }">
            <v-toolbar-title>
              <v-edit-dialog
                v-if="selectedPrinterFloor"
                @open="setEditedPrinterFloorName"
                @save="updatePrinterFloorName"
              >
                <v-btn color="secondary">
                  <v-icon v-if="hover" small>edit</v-icon>
                  {{ selectedPrinterFloor.name }}
                </v-btn>

                <template v-slot:input>
                  <v-text-field
                    v-model="editedPrinterFloorName"
                    :return-value.sync="editedPrinterFloorName"
                    counter
                    label="Edit"
                    single-line
                  ></v-text-field>
                </template>
              </v-edit-dialog>

              <span v-else> Select a floor on the left </span>
            </v-toolbar-title>
          </v-hover>

          <v-hover v-slot="{ hover }">
            <v-toolbar-title>
              <v-edit-dialog
                v-if="selectedPrinterFloor"
                @open="setEditedPrinterFloorNumber"
                @save="updatePrinterFloorNumber"
              >
                <v-btn color="secondary">
                  <v-icon v-if="hover" small>edit</v-icon>
                  {{ selectedPrinterFloor.floor }}
                </v-btn>

                <template v-slot:input>
                  <v-text-field
                    v-model="editedPrinterFloorNumber"
                    :return-value.sync="editedPrinterFloorNumber"
                    type="number"
                    label="Edit"
                    single-line
                  ></v-text-field>
                </template>
              </v-edit-dialog>
            </v-toolbar-title>
          </v-hover>

          <v-spacer></v-spacer>

          <v-btn v-if="selectedPrinterFloor" color="primary" @click="clickDeleteFloor()">
            <v-icon>delete</v-icon>
            Delete floor
          </v-btn>
        </v-toolbar>

        <v-list v-if="selectedPrinterFloor">
          <v-list-item v-for="x in showAddedGroups" :key="x">
            <v-list-item-content v-if="printerGroupInFloor(selectedPrinterFloor, x)">
              <v-list-item-title>
                {{ printerGroupInFloor(selectedPrinterFloor, x).name }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-content v-else>
              <v-select
                :items="unassignedGroups()"
                item-text="name"
                label="Not assigned"
                no-data-text="No printer groups left, create more"
                outlined
                return-object
                @change="addPrinterGroupToFloor(selectedPrinterFloor, $event)"
              ></v-select>
            </v-list-item-content>

            <v-list-item-action v-if="printerGroupInFloor(selectedPrinterFloor, x)">
              <v-btn @click="clearPrinterGroupFromFloor(selectedPrinterFloor, x)">
                <v-icon>close</v-icon>
                Clear
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
import { Printer } from "@/models/printers/printer.model";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { PrinterFloorService } from "@/backend/printer-floor.service";

@Component({
  components: {},
  data: () => ({
    selectedItem: 0,
  }),
})
export default class PrinterGroupsSettings extends Vue {
  editedPrinterFloorName: string = "";
  editedPrinterFloorNumber: number = 0;
  selectedItem: number;
  get showAddedGroups() {
    return this.selectedPrinterFloor.printerGroups?.length + 1;
  }

  get printerFloors() {
    return printersState.printerFloors;
  }

  get selectedPrinterFloor() {
    return printersState.printerFloors[this.selectedItem];
  }

  unassignedGroups() {
    return printersState.floorlessGroups;
  }

  printerGroupInFloor(floor: PrinterFloor, index: number): PrinterGroup | undefined {
    if (!floor?.printerGroups) return;

    const printerFloorGroup = floor.printerGroups[index - 1];
    if (!printerFloorGroup) return;
    return printersState.printerGroup(printerFloorGroup.printerGroupId);
  }

  async createFloor() {
    // Trigger watch connected to printer floor CRUD dialog
    printersState.setCreateFloorDialogOpened(true);
  }

  setEditedPrinterFloorName() {
    this.editedPrinterFloorName = this.selectedPrinterFloor.name;
  }

  setEditedPrinterFloorNumber() {
    this.editedPrinterFloorNumber = this.selectedPrinterFloor.floor;
  }

  async updatePrinterFloorName() {
    if (!this.selectedPrinterFloor?._id) return;

    const { _id: floorId } = this.selectedPrinterFloor;
    await printersState.updatePrinterFloorName({
      floorId,
      name: this.editedPrinterFloorName,
    });
  }

  async updatePrinterFloorNumber() {
    if (!this.selectedPrinterFloor?._id) return;

    const { _id: floorId } = this.selectedPrinterFloor;
    await printersState.updatePrinterFloorNumber({
      floorId,
      floorNumber: this.editedPrinterFloorNumber,
    });

    // Adapt to potential sort change
    this.selectedItem = -1;
  }

  async clickDeleteFloor() {
    if (!this.selectedPrinterFloor?._id) return;

    await printersState.deletePrinterFloor(this.selectedPrinterFloor._id);
  }

  async addPrinterGroupToFloor(floor: PrinterFloor, printerGroup: PrinterGroup) {
    if (!this.selectedPrinterFloor._id || !printerGroup?._id) return;

    await printersState.addPrinterGroupToFloor({
      floorId: this.selectedPrinterFloor._id,
      printerGroupId: printerGroup._id,
    });
  }

  async clearPrinterGroupFromFloor(floor: PrinterFloor, index: number) {
    const printerGroup = this.printerGroupInFloor(floor, index);
    if (!floor?._id || !printerGroup?._id) return;

    await printersState.deletePrinterGroupFromFloor({
      floorId: floor._id,
      printerGroupId: printerGroup._id,
    });
  }
}
</script>
