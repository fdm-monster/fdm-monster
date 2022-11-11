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
              <v-list-item-action-text> Floor number: {{ floor.floor }}</v-list-item-action-text>
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
                    label="Edit"
                    single-line
                    type="number"
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
          <v-list-item>
            <!-- New group -->
            <v-list-item-content>
              <v-select
                :items="unassignedGroups"
                item-text="name"
                label="Not assigned"
                no-data-text="No printer groups left, create more"
                outlined
                return-object
                @change="addPrinterGroupToFloor(selectedPrinterFloor, $event)"
              ></v-select>
            </v-list-item-content>
          </v-list-item>

          <!-- Existing groups -->
          <v-list-item v-for="x in showAddedGroups" :key="x">
            <v-list-item-content v-if="printerGroupInFloor(selectedPrinterFloor, x)">
              <v-list-item-title>
                {{ printerGroupInFloor(selectedPrinterFloor, x).name }}
              </v-list-item-title>
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
import { defineComponent } from "vue";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import { PrinterFloor } from "@/models/printer-floor/printer-floor.model";
import { usePrintersStore } from "@/store/printers.store";
import { useDialogsStore } from "@/store/dialog.store";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";

interface Data {
  editedPrinterFloorName: string;
  editedPrinterFloorNumber: number;
  selectedItem: number;
}

export default defineComponent({
  name: "PrinterFloorSettings",
  setup: () => {
    return {
      printersStore: usePrintersStore(),
      dialogsStore: useDialogsStore(),
    };
  },
  props: {},
  data: (): Data => ({
    selectedItem: 0,
    editedPrinterFloorName: "",
    editedPrinterFloorNumber: 0,
  }),
  created() {},
  mounted() {},
  computed: {
    printerFloors() {
      return this.printersStore.printerFloors;
    },
    selectedPrinterFloor() {
      return this.printersStore.printerFloors[this.selectedItem];
    },
    showAddedGroups() {
      return this.selectedPrinterFloor.printerGroups?.length + 1;
    },
    unassignedGroups() {
      return this.printersStore.floorlessGroups;
    },
  },
  methods: {
    printerGroupInFloor(floor: PrinterFloor, index: number): PrinterGroup | undefined {
      if (!floor?.printerGroups) return;

      const printerFloorGroup = floor.printerGroups[index - 1];
      if (!printerFloorGroup) return;
      return this.printersStore.printerGroup(printerFloorGroup.printerGroupId);
    },
    async createFloor() {
      this.dialogsStore.openDialog(DialogName.CreatePrinterFloorDialog);
    },
    setEditedPrinterFloorName() {
      this.editedPrinterFloorName = this.selectedPrinterFloor.name;
    },
    setEditedPrinterFloorNumber() {
      this.editedPrinterFloorNumber = this.selectedPrinterFloor.floor;
    },
    async updatePrinterFloorName() {
      if (!this.selectedPrinterFloor?._id) return;
      const { _id: floorId } = this.selectedPrinterFloor;
      await this.printersStore.updatePrinterFloorName({
        floorId,
        name: this.editedPrinterFloorName,
      });
    },
    async updatePrinterFloorNumber() {
      if (!this.selectedPrinterFloor?._id) return;
      const { _id: floorId } = this.selectedPrinterFloor;
      await this.printersStore.updatePrinterFloorNumber({
        floorId,
        floorNumber: this.editedPrinterFloorNumber,
      });
      // Adapt to potential sort change
      this.selectedItem = -1;
    },
    async clickDeleteFloor() {
      if (!this.selectedPrinterFloor?._id) return;

      await this.printersStore.deletePrinterFloor(this.selectedPrinterFloor._id);
    },
    async addPrinterGroupToFloor(floor: PrinterFloor, printerGroup: PrinterGroup) {
      if (!this.selectedPrinterFloor._id || !printerGroup?._id) return;

      await this.printersStore.addPrinterGroupToFloor({
        floorId: this.selectedPrinterFloor._id,
        printerGroupId: printerGroup._id,
      });
    },
    async clearPrinterGroupFromFloor(floor: PrinterFloor, index: number) {
      const printerGroup = this.printerGroupInFloor(floor, index);
      if (!floor?._id || !printerGroup?._id) return;

      await this.printersStore.deletePrinterGroupFromFloor({
        floorId: floor._id,
        printerGroupId: printerGroup._id,
      });
    },
  },
  watch: {},
});
</script>
