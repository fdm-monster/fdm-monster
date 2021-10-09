<template>
  <v-container v-if="printer">
    <PrinterDeleteAction :printer="printer" />
    Name: {{ printer.printerName }} <br />
    URL: {{ printer.printerURL }}

    <FileList :file-list="printer.fileList" :printer-id="printerId" />
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileList from "@/components/PrinterList/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";
import PrinterDeleteAction from "@/components/PrinterList/PrinterDeleteAction.vue";

@Component({
  components: { FileList, PrinterDeleteAction }
})
export default class PrinterDetails extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer.id;
  }
}
</script>
