<template>
  <v-card>
    <v-card-title>
      Printers
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        class="p-2"
        clearable
        label="Search"
        prepend-icon="search"
        single-line
      ></v-text-field>
    </v-card-title>

    <v-data-table
      :expanded.sync="expanded"
      :headers="tableHeaders"
      :items="printers"
      :search="search"
      :single-expand="true"
      class="elevation-1"
      item-key="id"
      show-expand
      @click:row="clickRow"
    >
      <template v-if="reorder" v-slot:body="props">
        <draggable :list="props.items" tag="tbody">
          <slot></slot>
          <tr v-for="(printer, index) in props.items" :key="index">
            <td>
              <v-icon class="reorder-row-icon">reorder</v-icon>
              {{ printer.sortIndex }}
            </td>
            <td>{{ printer.printerName }}</td>
            <td>{{ printer.group }}</td>
            <td>{{ printer.enabled }}</td>
          </tr>
        </draggable>
      </template>
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>Filtering {{ printers.length || 0 }} printers</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-switch v-model="reorder" class="mt-5 mr-3" dark label="Sort mode" />

          <v-btn
            class="ml-3"
            color="primary"
            type="button"
            @click.self="openImportJsonPrintersDialog()"
          >
            Import JSON Printers
          </v-btn>

          <v-btn class="ml-3" color="primary" type="button" @click.self="openCreatePrinterDialog()">
            Create Printer
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-switch
          v-model="item.enabled"
          color="primary"
          dark
          inset
          @click.native.capture.stop="toggleEnabled($event, item)"
        >
          {{ item.enabled }}
        </v-switch>
      </template>
      <template v-slot:item.printerName="{ item }">
        <v-chip color="primary" dark>
          {{ item.printerName || item.printerURL }}
        </v-chip>
      </template>
      <template v-slot:item.group="{ item }">
        <v-chip v-if="item.group" color="primary" dark>
          {{ item.group }}
        </v-chip>
      </template>
      <template v-slot:item.actions="{ item }">
        <PrinterUrlAction :printer="item" />
        <PrinterConnectionAction :printer="item" />
        <PrinterEmergencyStopAction :printer="item" />
        <PrinterSettingsAction :printer="item" v-on:update:show="openEditDialog(item)" />
      </template>
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <PrinterDetails :printer="item"></PrinterDetails>
        </td>
      </template>
    </v-data-table>

    <v-data-table
      class="disabled-highlight"
      key="id"
      :headers="firmwareTableHeaders"
      :items="firmwareUpdateStates"
    >
      <template v-slot:top>
        <v-toolbar flat prominent>
          <v-toolbar-title>
            <div>Showing firmware update status</div>
            <small>Latest (downloaded) firmware: {{ latestReleaseVersion }}</small>
            <br />
            <v-btn color="primary" small @click="loadFirmwareData">Scan printers (SLOW)</v-btn>
          </v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
      </template>
      <template v-slot:no-data> No firmware information loaded.</template>
      <template v-slot:no-results> No results</template>
      <template v-slot:item.actions="{ item }">
        <v-btn :disabled="isPluginInstalled(item)" @click="installPlugin(item)"
          >Install plugin</v-btn
        >
        Feature coming soon:
        <v-btn
          color="primary"
          @click="updateFirmware(item)"
          :disabled="true || !isUpdatableFirmware(item.firmware)"
        >
          <v-icon>updates</v-icon>
          Update {{ isVirtualFirmware(item.firmware) ? "(VIRTUAL)" : "" }}
        </v-btn>
        <!--        Sadly this is not available yet -->
        <!--        <div v-if="isVirtualFirmware(item.firmware)">-->
        <!--          <v-btn-->
        <!--            color="primary"-->
        <!--            @click="toggleVirtualFirmware(item)"-->
        <!--            :disabled="!isVirtualFirmware(item.firmware)"-->
        <!--          >-->
        <!--            <v-icon>query_stats</v-icon>-->
        <!--            Toggle VIRTUAL {{ isVirtualFirmware(item.firmware) ? "(enabled)" : "(disabled)" }}-->
        <!--          </v-btn>-->
        <!--        </div>-->
      </template>
    </v-data-table>

    <BatchJsonCreateDialog :show.sync="showJsonImportDialog" />
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import draggable from "vuedraggable";
import { PrintersService } from "@/backend/printers.service";
import PrinterDetails from "@/components/PrinterList/PrinterDetails.vue";
import PrinterUrlAction from "@/components/Generic/Actions/PrinterUrlAction.vue";
import PrinterSettingsAction from "@/components/Generic/Actions/PrinterSettingsAction.vue";
import PrinterConnectionAction from "@/components/Generic/Actions/PrinterConnectionAction.vue";
import { printersState } from "@/store/printers.state";
import BatchJsonCreateDialog from "@/components/Generic/Dialogs/BatchJsonCreateDialog.vue";
import UpdatePrinterDialog from "@/components/Generic/Dialogs/UpdatePrinterDialog.vue";
import CreatePrinterDialog from "@/components/Generic/Dialogs/CreatePrinterDialog.vue";
import PrinterEmergencyStopAction from "@/components/Generic/Actions/PrinterEmergencyStopAction.vue";
import { PrinterFirmwareUpdateService } from "@/backend/printer-firmware-update.service";
import { PrusaFirmwareReleaseModel } from "@/models/plugins/firmware-updates/prusa-firmware-release.model";
import { PrinterFirmwareStateModel } from "@/models/plugins/firmware-updates/printer-firmware-state.model";

@Component({
  components: {
    PrinterDetails,
    draggable,
    BatchJsonCreateDialog,
    UpdatePrinterDialog,
    CreatePrinterDialog,
    PrinterUrlAction,
    PrinterSettingsAction,
    PrinterEmergencyStopAction,
    PrinterConnectionAction
  },
  data: () => ({
    firmwareUpdates: []
  })
})
export default class Printers extends Vue {
  reorder = false;
  firmwareUpdateStates: PrinterFirmwareStateModel[] = [];
  firmwareReleases: PrusaFirmwareReleaseModel[] = [];

  autoPrint = true;
  showJsonImportDialog = false;
  search = "";
  expanded: Printer[] = [];
  tableHeaders = [
    {
      text: "Order",
      align: "start",
      sortable: true,
      value: "sortIndex"
    },
    { text: "Enabled", value: "enabled" },
    {
      text: "Printer Name",
      align: "start",
      sortable: true,
      value: "printerName"
    },
    { text: "Groups", value: "group" },
    { text: "Actions", value: "actions", sortable: false },
    { text: "", value: "data-table-expand" }
  ];
  firmwareTableHeaders = [
    {
      text: "Printer Name",
      align: "start",
      sortable: true,
      value: "printerName"
    },
    {
      text: "Firmware Version",
      sortable: true,
      value: "firmware"
    },
    {
      text: "Plugin installed",
      value: "pluginInstalled"
    },
    { text: "Actions", value: "actions", sortable: false }
  ];

  async created() {
    this.firmwareReleases = await PrinterFirmwareUpdateService.getFirmwareReleases();
  }

  get printers() {
    return printersState.printers;
  }

  get latestReleaseVersion() {
    const result = this.firmwareReleases.sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    );

    if (!result?.length) return "?";
    return result[0].tag_name;
  }

  isVirtualFirmware(firmwareTag: string) {
    const firmwareTagUpper = firmwareTag?.toUpperCase();
    if (!firmwareTagUpper) return false;
    if (firmwareTagUpper.includes("VIRTUAL")) return true;
  }

  isUpdatableFirmware(firmwareTag: string) {
    const firmwareTagUpper = firmwareTag?.toUpperCase();
    if (!firmwareTagUpper) return false;
    if (this.isVirtualFirmware(firmwareTag)) return false;
  }

  isPluginInstalled(printer: Printer) {
    const firmwarePluginState = this.firmwareUpdateStates.find((f) => f.id === printer.id);
    return firmwarePluginState?.pluginInstalled || false;
  }

  async loadFirmwareData() {
    const updateStates = await PrinterFirmwareUpdateService.loadFirmwareUpdateState();
    this.firmwareUpdateStates = updateStates?.firmwareStates || [];
  }

  async installPlugin(printer: Printer) {
    await PrinterFirmwareUpdateService.installPlugin(printer.id);
  }

  async updateFirmware(printer: Printer) {
    //TODO
  }

  openEditDialog(printer: Printer) {
    printersState.setUpdateDialogPrinter(printer);
  }

  openCreatePrinterDialog() {
    printersState.setCreateDialogOpened(true);
  }

  clickRow(item: Printer, event: any) {
    if (event.isExpanded) {
      const index = this.expanded.findIndex((i) => i === item);
      this.expanded.splice(index, 1);
    } else {
      this.expanded.push(item);
    }
  }

  async openImportJsonPrintersDialog() {
    this.showJsonImportDialog = true;
  }

  async toggleEnabled(event: any, printer: Printer) {
    if (!printer.id) {
      throw new Error("Printer ID not set, cant toggle enabled");
    }

    printer.enabled = !printer.enabled;
    await PrintersService.toggleEnabled(printer.id, printer.enabled);
  }
}
</script>

<style lang="scss">
.disabled-highlight tbody {
  tr:hover {
    background-color: transparent !important;
  }
}

.reorder-row-icon {
  cursor: move;
}
</style>
