<template>
  <v-container v-if="printer">
    <v-btn @click="deletePrinter()">Delete printer</v-btn>
    Name: {{ printer.printerName }} <br />
    URL: {{ printer.printerURL }}

    <FileList :file-list="printer.fileList" :printer-id="printerId" />
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileList from "@/components/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import { ACTIONS } from "@/store/printers/printers.actions";

@Component({
  components: { FileList }
})
export default class PrinterDetails extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }

  async deletePrinter() {
    await this.$store.dispatch(ACTIONS.deletePrinter, this.printerId);
  }
}
</script>
