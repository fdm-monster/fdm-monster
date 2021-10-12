<template>
  <v-card class="pa-2 tile" outlined tile @click="selectPrinter()">
    Printer {{ name }}
    <v-btn icon ripple>
      <v-icon>stop</v-icon>
    </v-btn>
    <v-btn icon ripple>
      <v-icon>info</v-icon>
    </v-btn>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { printersState } from "@/store/printers.state";

@Component({
  components: {}
})
export default class PrinterGridTile extends Vue {
  @Prop() name: string;

  get printers() {
    return printersState.printers;
  }

  selectPrinter(printer: Printer) {
    console.log("asd", printer);
  }
}
</script>

<style>
.tile:hover {
  border: 1px solid red;
}

.tile {
  min-height: 80px;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
}
</style>
