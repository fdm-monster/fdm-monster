<template>
  <v-card class="tile" outlined tile @click="selectPrinter()">
    <v-container>
      {{ name }}
      <v-btn class="float-right" icon @click.prevent.stop="clickInfo()">
        <v-icon>info</v-icon>
      </v-btn>
      <v-btn class="float-right" icon @click.prevent.stop="clickStop()">
        <v-icon>stop</v-icon>
      </v-btn>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";

@Component({
  components: {}
})
export default class PrinterGridTile extends Vue {
  @Prop() name: string;

  get printers() {
    return printersState.printers;
  }

  clickInfo() {
    console.log("info");
  }

  clickStop() {
    console.log("stop");
  }

  selectPrinter() {
    console.log("asd");
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
