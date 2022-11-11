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
          <v-list-item-title>Create new group</v-list-item-title>
          <v-list-item-subtitle>
            Creates an empty group to be placed on the grid
            <br />
            <v-btn color="primary" @click="createGroup()">Create group</v-btn>
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
              <v-edit-dialog
                v-if="selectedPrinterGroup"
                @open="setEditedPrinterGroupName"
                @save="updatePrinterGroupName"
              >
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

          <v-btn
            v-if="selectedPrinterGroup"
            class="mr-2"
            color="secondary"
            @click="clickUpdateGroup()"
          >
            <v-icon>edit</v-icon>
            Update group
          </v-btn>
          <v-btn v-if="selectedPrinterGroup" color="primary" @click="clickDeleteGroup()">
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
              <v-list-item-title>
                {{ x - 1 }}
                <v-select
                  :items="unassignedPrinters()"
                  flat
                  item-text="printerName"
                  label="Not assigned"
                  no-data-text="No printers left"
                  return-object
                  @change="addPrinterToGroup(selectedPrinterGroup, x, $event)"
                ></v-select>
              </v-list-item-title>
            </v-list-item-content>

            <v-list-item-action v-if="printerInGroup(selectedPrinterGroup, x)">
              <v-btn @click="clearPrinterFromGroup(selectedPrinterGroup, x)">
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
import { Printer } from "@/models/printers/printer.model";
import { usePrintersStore } from "@/store/printers.store";
import { useDialogsStore } from "@/store/dialog.store";
import { DialogName } from "@/components/Generic/Dialogs/dialog.constants";

export default defineComponent({
  name: "PrinterGroupsSettings",
  components: {},
  setup() {
    return {
      printersStore: usePrintersStore(),
      dialogsStore: useDialogsStore(),
    };
  },
  data: (): {
    selectedItem: number;
    editedPrinterGroupName: string;
    printersPerGroup: 4;
  } => ({
    selectedItem: 0,
    editedPrinterGroupName: "",
    printersPerGroup: 4,
  }),
  computed: {
    printerGroups() {
      return this.printersStore.printerGroups;
    },
    selectedPrinterGroup() {
      return this.printersStore.printerGroups[this.selectedItem];
    },
  },
  methods: {
    printerLocation(group: PrinterGroup, index: number) {
      return group?.printers[index - 1]?.location;
    },
    unassignedPrinters() {
      return this.printersStore.ungroupedPrinters;
    },
    printerInGroup(group: PrinterGroup, index: number): Printer | undefined {
      if (!group?.printers) return;
      const printer = group.printers[index - 1];
      return this.printersStore.printer(printer?.printerId);
    },
    setEditedPrinterGroupName() {
      this.editedPrinterGroupName = this.selectedPrinterGroup.name;
    },
    async createGroup() {
      this.printersStore.setUpdateDialogPrinterGroup();
      this.dialogsStore.openDialog(DialogName.CreatePrinterGroupDialog);
    },
    async updatePrinterGroupName() {
      if (!this.selectedPrinterGroup?._id) return;

      const { _id: groupId } = this.selectedPrinterGroup;
      await this.printersStore.updatePrinterGroupName({
        groupId,
        name: this.editedPrinterGroupName,
      });
      // Adapt to potential sort change
      this.selectedItem = -1;
    },
    async clickDeleteGroup() {
      if (!this.selectedPrinterGroup?._id) return;
      await this.printersStore.deletePrinterGroup(this.selectedPrinterGroup._id);
    },
    async clickUpdateGroup() {
      this.printersStore.setUpdateDialogPrinterGroup(this.selectedPrinterGroup);
      this.dialogsStore.openDialog(DialogName.CreatePrinterGroupDialog);
    },
    async addPrinterToGroup(group: PrinterGroup, position: number, printer: Printer) {
      if (!this.selectedPrinterGroup._id) return;
      const location = (position - 1).toString();
      await this.printersStore.addPrinterToGroup({
        groupId: this.selectedPrinterGroup._id,
        printerId: printer.id,
        location,
      });
    },
    async clearPrinterFromGroup(group: PrinterGroup, index: number) {
      const printer = this.printerInGroup(group, index);
      if (!group?._id || !printer) return;
      await this.printersStore.deletePrinterFromGroup({
        groupId: group._id,
        printerId: printer.id,
      });
    },
  },
});
</script>
