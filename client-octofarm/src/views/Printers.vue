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

    <v-data-table
      :expanded.sync="expanded"
      :headers="dessertHeaders"
      :items="printers"
      :search="search"
      :single-expand="true"
      class="elevation-1"
      item-key="_id"
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
          <v-switch v-model="reorder" class="mt-5" dark label="Sort mode">Reorder</v-switch>
        </v-toolbar>
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
        <v-btn
          class="ma-2"
          color="primary"
          fab
          small
          @click.c.capture.native.stop="openPrinterURL(item)"
        >
          <v-icon>directions</v-icon>
        </v-btn>
        <v-btn v-if="item.enabled" class="ma-2" color="primary" fab small>
          <v-icon>usb</v-icon>
        </v-btn>
        <v-btn class="ma-2" color="primary" fab small>
          <v-icon>settings</v-icon>
        </v-btn>
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
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          More info about
          {{
            JSON.stringify({ _id: item._id, name: item.printerName, printerURL: item.printerURL })
          }}
        </td>
      </template>
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";
import { Printer } from "@/models/printers/printer.model";
import draggable from "vuedraggable";
import { PrintersService } from "@/backend/printers.service";
import { SSEClient } from "vue-sse";

@Component({
  components: { draggable }
})
export default class Printers extends Vue {
  @Action loadPrinters: () => Promise<Printer[]>;
  @Getter printers: Printer[];

  sseClient?: SSEClient;

  reorder = false;
  search = "";
  expanded = [];
  singleExpand = true;
  dessertHeaders = [
    {
      text: "Order",
      align: "start",
      sortable: true,
      value: "sortIndex"
    },
    {
      text: "Printer Name",
      align: "start",
      sortable: true,
      value: "printerName"
    },
    { text: "Group", value: "group" },
    { text: "Actions", value: "actions", sortable: false },
    { text: "Enabled", value: "enabled" },
    { text: "", value: "data-table-expand" }
  ];

  async toggleEnabled(event: any, printer: Printer) {
    if (!printer._id) {
      throw new Error("Printer ID not set, cant toggle enabled");
    }
    const isPrinterEnabled = printer.enabled;
    if (!isPrinterEnabled || confirm("Are you sure?")) {
      printer.enabled = !printer.enabled;
      await PrintersService.toggleEnabled(printer._id, printer.enabled);
    }
  }

  async mounted() {
    await this.loadPrinters();

    this.sseClient = await this.$sse.create(this.$sse.$defaultConfig);
    this.sseClient.on("message", (msg) => this.onMessage(msg));
    this.sseClient.on("error", (err: any) =>
      console.error("Failed to parse or lost connection:", err)
    );
    this.sseClient
      .connect()
      .catch((err: any) => console.error("Failed make initial connection:", err));
  }

  onMessage(message: any) {}

  beforeDestroy() {
    this.sseClient?.disconnect();
  }

  openPrinterURL(printer: Printer) {
    const printerURL = printer.printerURL;
    if (!printerURL) {
      return;
    }
    window.open(printerURL);
  }
}
</script>

<style>
.reorder-row-icon {
  cursor: move;
}
</style>
