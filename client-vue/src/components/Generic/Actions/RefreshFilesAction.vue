<template>
  <v-btn color="secondary" @click="getFiles">
    <v-icon>refresh</v-icon>
    <span class="d-none d-lg-inline">Refresh files</span>
  </v-btn>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { printersState } from "@/store/printers.state";
import { Printer } from "@/models/printers/printer.model";

@Component({
  data: () => ({})
})
export default class RefreshFilesAction extends Vue {
  @Prop() printer: Printer;

  async getFiles() {
    await printersState.loadPrinterFiles({
      printerId: this.printer.id,
      recursive: false
    });
  }
}
</script>
