<template>
  <div v-if="printer">
    Name: {{ printer.printerName }} <br />
    URL: {{ printer.printerURL }}

    <FileList :file-list="printer.fileList" :printer-id="printerId" />
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileList from "@/components/FileList.vue";
import { Prop } from "vue-property-decorator";
import { Printer } from "@/models/printers/printer.model";

@Component({
  components: { FileList }
})
export default class PrinterDetails extends Vue {
  @Prop() printer: Printer;

  get printerId() {
    return this.printer._id;
  }
}
</script>
