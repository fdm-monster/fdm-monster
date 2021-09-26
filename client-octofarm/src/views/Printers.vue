<template>
  <v-data-table
    :headers="dessertHeaders"
    :items="printers"
    :single-expand="true"
    :expanded.sync="expanded"
    class="elevation-1"
    item-key="_id"
    show-expand
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>Expandable Table</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-switch v-model="singleExpand" class="mt-2" label="Single expand"></v-switch>
      </v-toolbar>
    </template>
    <template v-slot:item.name="{ item }">
      <v-chip
          color="primary"
          dark
      >
        {{ item.printerName || item.printerURL }}
      </v-chip>
    </template>
    <template v-slot:item.group="{ item }">
      <v-chip
          v-if="item.group"
          color="primary"
          dark
      >
        {{ item.group }}
      </v-chip>
    </template>
    <template v-slot:expanded-item="{ headers, item }">
      <td :colspan="headers.length">More info about {{ JSON.stringify({_id:item._id, name:item.printerName, printerURL:item.printerURL}) }}</td>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: {}
})
export default class Printers extends Vue {
  @Action loadPrinters: () => Promise<Printer[]>;
  @Getter printers: Printer[];

  expanded = [];
  singleExpand = true;
  dessertHeaders = [
    {
      text: "Printer Name",
      align: "start",
      sortable: true,
      value: "name"
    },
    { text: "Group", value: "group" },
    { text: "Enabled", value: "enabled" },
    { text: "", value: "data-table-expand" }
  ];

  async mounted() {
    await this.loadPrinters();

    console.log(this.printers);
  }
}
</script>
