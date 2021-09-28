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
          <v-toolbar-title>Expandable Table</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-switch v-model="singleExpand" class="mt-5 mr-3" label="Single expand"></v-switch>
          <v-switch v-model="reorder" :label="`Reorder: ${reorder.toString()}`" class="mt-5"
            >Reorder
          </v-switch>
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
      <template v-slot:item.enabled="{ item }">
        <v-switch v-model="item.enabled" color="primary" dark inset @change="toggleEnabled(item)">
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

@Component({
  components: { draggable }
})
export default class Printers extends Vue {
  @Action loadPrinters: () => Promise<Printer[]>;
  @Getter printers: Printer[];

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
    { text: "Group", value: "group", align: "start" },
    { text: "Enabled", value: "enabled" },
    { text: "", value: "data-table-expand" }
  ];

  async toggleEnabled(printer: Printer) {
    if (!printer._id) {
      throw new Error("Printer ID not set, cant toggle enabled");
    }
    const answer = confirm("Are you sure?");
    if (answer) {
      await PrintersService.toggleEnabled(printer._id, !printer.enabled);
    }
  }

  async mounted() {
    await this.loadPrinters();
  }
}
</script>

<style>
.reorder-row-icon {
  cursor: move;
}
</style>
