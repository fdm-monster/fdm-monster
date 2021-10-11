<template>
  <v-card>
    <v-card-title>
      Printers
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        class="p-2"
        hide-details
        label="Search"
        single-line
      ></v-text-field>
    </v-card-title>

    <BatchJsonCreateDialog :show.sync="showDialog" v-on:update:show="onChangeShowDialog($event)"/>

    <v-data-table
      :expanded.sync="expanded"
      :headers="tableHeaders"
      :items="printers"
      :search="search"
      :single-expand="true"
      class="elevation-1"
      item-key="id"
      show-expand
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
          <v-toolbar-title>Showing printers</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-switch v-model="reorder" class="mt-5 mr-3" dark label="Sort mode"/>

          <v-btn class="ml-3" color="primary" disabled type="button" @click="createPrinterModal()">
            Import JSON Printers
          </v-btn>

          <v-switch
            v-show="false"
            v-model="deleteMany"
            class="mt-5 mr-3"
            dark
            label="Delete printers"
          />
          <v-switch
            v-show="false"
            v-model="bulkFileClean"
            class="mt-5 mr-3"
            dark
            disabled
            label="Bulk file clean"
          />
          <v-switch
            v-show="false"
            v-model="bulkUpdate"
            class="mt-5"
            dark
            disabled
            label="Bulk file clean"
          />
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
        <PrinterUrlAction :printer="item"/>
        <PrinterConnectionAction :printer="item"/>
        <PrinterSettingsAction :printer="item"
                               v-on:update:show="openEditDialog"/>
      </template>
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <PrinterDetails :printer="item"></PrinterDetails>
        </td>
      </template>
    </v-data-table>

    <UpdatePrinterDialog
      :printer-id="selectedPrinterId"
      :show.sync="showEditDialog"
      v-on:update:show="onChangeShowEditDialog($event)"
    />
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import draggable from "vuedraggable";
import { PrintersService } from "@/backend/printers.service";
import { PrinterSseMessage } from "@/models/sse-messages/printer-sse-message.model";
import { sseMessageGlobal } from "@/event-bus/sse.events";
import PrinterDetails from "@/components/PrinterList/PrinterDetails.vue";
import PrinterUrlAction from "@/components/Generic/Actions/PrinterUrlAction.vue";
import PrinterSettingsAction from "@/components/Generic/Actions/PrinterSettingsAction.vue";
import PrinterConnectionAction from "@/components/Generic/Actions/PrinterConnectionAction.vue";
import { printersState } from "@/store/printers.state";
import BatchJsonCreateDialog from "@/components/Dialogs/BatchJsonCreateDialog.vue";
import UpdatePrinterDialog from "@/components/Dialogs/UpdatePrinterDialog.vue";

@Component({
  components: {
    PrinterDetails,
    draggable,
    BatchJsonCreateDialog,
    UpdatePrinterDialog,
    PrinterUrlAction,
    PrinterSettingsAction,
    PrinterConnectionAction
  }
})
export default class Printers extends Vue {
  reorder = false;
  deleteMany = false;
  bulkFileClean = false;
  bulkUpdate = false;

  autoPrint = true;
  showDialog = false;

  showEditDialog = false;
  selectedPrinterId?: string = "";
  search = "";
  expanded = [];
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

  get printers() {
    return printersState.printers;
  }

  openEditDialog(printerId:string) {
    this.selectedPrinterId = printerId;
    this.showEditDialog = true;
  }

  onChangeShowEditDialog(event: boolean) {
    if (!event) {
      this.selectedPrinterId = undefined;
    }
  }

  async createPrinterModal() {
    this.showDialog = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChangeShowDialog(event: any) {
    // Placeholder
  }

  async toggleEnabled(event: any, printer: Printer) {
    if (!printer.id) {
      throw new Error("Printer ID not set, cant toggle enabled");
    }
    const isPrinterEnabled = printer.enabled;
    if (!isPrinterEnabled || confirm("Are you sure?")) {
      printer.enabled = !printer.enabled;
      await PrintersService.toggleEnabled(printer.id, printer.enabled);
    }
  }

  async mounted() {
    await printersState.loadPrinters();
    await printersState.loadPrinterGroups();

    this.$bus.on(sseMessageGlobal, (data: PrinterSseMessage) => {
      this.onSseMessage(data);
    });
  }

  onSseMessage(message: PrinterSseMessage) {
    if (!message) return;
    const updatedPrinters = message.printers;

    let existingPrinters = this.printers.map((p) => p.id);

    updatedPrinters.forEach((p) => {
      const printerIndex = existingPrinters.findIndex((printerId) => printerId === p.id);
      existingPrinters.splice(printerIndex, 1);
    });

    // TODO superfluence is ignored, is it needed tho?
  }
}
</script>

<style>
.reorder-row-icon {
  cursor: move;
}
</style>
